'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.handler = exports.builder = exports.desc = exports.command = void 0;
const find_root_1 = require('@manypkg/find-root');
const fs_1 = require('fs');
const path_1 = require('path');
const pascal_case_1 = require('pascal-case');
exports.command = 'create <name> [options]';
exports.desc = 'Create files for a component with name <name>';
const builder = (yargs) =>
  yargs
    .options({
      path: {
        type: 'string',
        alias: 'p',
        description: 'Path where to create the Component',
      },
      isTs: {
        type: 'boolean',
        alias: 'ts',
        description: 'Should generate typescript files',
      },
      isScss: {
        type: 'boolean',
        alias: 'scss',
        description: 'Should generate Scss style',
      },
    })
    .positional('name', {
      type: 'string',
      description: 'Name of the Component to create',
    });
exports.builder = builder;
const handler = (argv) => {
  const root = (0, find_root_1.findRootSync)(process.cwd());
  if (!argv.isTs) argv.isTs = containFiles(root, ['.tsx', '.ts']);
  if (!argv.isScss) argv.isScss = containFiles(root, '.scss');
  if (!argv.name) process.exit(1);
  generateFiles(argv);
  updateIndexes(argv);
  process.exit(0);
};
exports.handler = handler;
const generateFiles = (argv) => {
  const path = argv.path ? argv.path : process.cwd();
  const componentName = (0, pascal_case_1.pascalCase)(argv.name);
  const componentDir = (0, path_1.join)(path, componentName);
  if ((0, fs_1.existsSync)(componentDir)) {
    console.log(
      `Cannot create component, a directory with name: ${componentName} already exists !`,
    );
    process.exit(1);
  } else (0, fs_1.mkdirSync)(componentDir); //Create component Directory
  //Main component file
  const componentFile = (0, path_1.join)(
    componentDir,
    `${componentName}.${argv.isTs ? 'tsx' : 'jsx'}`,
  );
  const componenrFileContent = generateComponentContent(argv);
  (0, fs_1.writeFileSync)(componentFile, componenrFileContent);
  //Component Style file
  const componentStyleFile = (0, path_1.join)(
    componentDir,
    `${componentName}.${argv.isScss ? 'scss' : 'css'}`,
  );
  (0, fs_1.writeFileSync)(componentStyleFile, '');
  //Component Story file
  const componentStoryFile = (0, path_1.join)(
    componentDir,
    `${componentName}.stories.${argv.isTs ? 'tsx' : 'jsx'}`,
  );
  const componentStoryFileContent = generateComponentStoryContent(argv);
  (0, fs_1.writeFileSync)(componentStoryFile, componentStoryFileContent);
  //Component Test file
  const componentTestFile = (0, path_1.join)(
    componentDir,
    `${componentName}.test.${argv.isTs ? 'tsx' : 'jsx'}`,
  );
  const componentTestFileContent = generateComponentTestContent(argv);
  (0, fs_1.writeFileSync)(componentTestFile, componentTestFileContent);
  //Index file
  const componentIndexFile = (0, path_1.join)(
    componentDir,
    `index.${argv.isTs ? 'ts' : 'js'}`,
  );
  const componentIndexFileContent = generateComponentIndexContent(argv);
  (0, fs_1.writeFileSync)(componentIndexFile, componentIndexFileContent);
};
const updateIndexes = (argv) => {
  const path = argv.path ? argv.path : process.cwd();
  const indexPath = (0, path_1.join)(path, `index.${argv.isTs ? 'ts' : 'js'}`);
  const indexContent = formatString(
    `export { default as {0} } from "./{0}"`,
    (0, pascal_case_1.pascalCase)(argv.name),
  );
  if ((0, fs_1.existsSync)(indexPath))
    (0, fs_1.appendFileSync)(indexPath, indexContent);
  else (0, fs_1.writeFileSync)(indexPath, indexContent);
};
const containFiles = (startPath, filter) => {
  let res = false;
  if (!(0, fs_1.existsSync)(startPath)) return false;
  const files = (0, fs_1.readdirSync)(startPath);
  files.forEach((file) => {
    if (res) return res;
    const filename = (0, path_1.join)(startPath, file);
    const stat = (0, fs_1.lstatSync)(filename);
    if (stat.isDirectory() && !shouldExclude(file))
      res = containFiles(filename, filter);
    else {
      if (typeof filter == 'string') res = filename.indexOf(filter) >= 0;
      else res = filter.map((f) => filename.indexOf(f) >= 0).includes(true);
    }
  });
  return res;
};
const shouldExclude = (file) => {
  const excludeDir = ['node_modules', 'build', 'bin', 'lib'];
  if (file[0] == '.') return true;
  if (excludeDir.indexOf(file) != -1) return true;
  return false;
};
const formatString = (str, ...val) => {
  let result = str;
  val.forEach(
    (value, index) =>
      (result = result.replace(new RegExp(`\\{${index}}`, 'g'), value)),
  );
  return result;
};
const generateComponentContent = (argv) => {
  return formatString(
    argv.isTs ? componentContent.ts : componentContent.js,
    (0, pascal_case_1.pascalCase)(argv.name),
    argv.isScss ? 'scss' : 'css',
  );
};
const componentContent = {
  ts: `import React from "react"\nimport "./{0}.{1}"\n\nexport interface {0}Props {\n\t//complete your custom props here\n}\n\nconst {0} = (props: {0}Props) => {\n\treturn <></>\n}\n\nexport default {0}`,
  js: `import React from 'react';\nimport PropTypes from 'prop-types';\nimport "./{0}.{1}";\n\nexport const {0} = ({ ...props }) => {\n\treturn <></>;\n};\n\n{0}.propTypes = {\n\t//Add custom propTypes\n};\n\n{0}.defaultProps = {\n\t//Add default props values\n};`,
};
const generateComponentStoryContent = (argv) => {
  return formatString(
    argv.isTs ? componentStoryContent.ts : componentStoryContent.js,
    (0, pascal_case_1.pascalCase)(argv.name),
  );
};
const componentStoryContent = {
  ts: `import React from "react"\nimport { ComponentStory, ComponentMeta } from "@storybook/react"\nimport {0} from "./{0}"\n\nexport default {\n\ttitle: "PorfolioComponentLibrary/{0}",\n\tcomponent: {0},\n} as ComponentMeta<typeof {0}>\n\nconst Template: ComponentStory<typeof {0}> = (args) => <{0} {...args} />\n\n//Stories\nexport const BasicStory = Template.bind({})\nBasicStory.args = {\n\t//Add props values for this story\n}`,
  js: `import React from 'react';\nimport { {0} } from './{0}';\n\nexport default {\n\ttitle: 'PorfolioComponentLibrary/{0}',\n\tcomponent: {0},\n\t// More on argTypes: https://storybook.js.org/docs/react/api/argtypes\n\targTypes: {\n\t\t//Add Custom argTypes here\n\t},\n};\n\nconst Template = (args) => <{0} {...args} />;\n\n//Stories\nexport const BasicStory = Template.bind({});\nBasicStory.args = {\n\t//Add props values for this story\n};`,
};
const generateComponentTestContent = (argv) => {
  return formatString(
    argv.isTs ? componentTestContent.ts : componentTestContent.js,
    (0, pascal_case_1.pascalCase)(argv.name),
  );
};
const componentTestContent = {
  ts: `import React from "react"\nimport { render } from "@testing-library/react"\n\nimport {0} from "./{0}"\n\ndescribe("{0}", () => {\n\ttest("renders the {0} component", () => {\n\t\trender(<{0} />)\n\t})\n})`,
  js: `//javascript component test here`,
};
const generateComponentIndexContent = (argv) => {
  return formatString(
    argv.isTs ? componentIndexContent.ts : componentIndexContent.js,
    (0, pascal_case_1.pascalCase)(argv.name),
  );
};
const componentIndexContent = {
  ts: `export { default } from "./{0}"`,
  js: `//javascript index here`,
};
