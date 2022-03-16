import { Arguments, CommandBuilder } from "yargs";
import { findRootSync } from "@manypkg/find-root";
import { appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join,  } from "path";
import { pascalCase } from "pascal-case";

type Options = {
    name: string,
    path: string | undefined,
}

export const command: string = 'create <name> [options]'
export const desc: string = 'Create files for a component with name <name>'

export const builder: CommandBuilder<Options> = (yargs) => yargs
    .options({
        path: { type: 'string', alias: 'p', description: "Path where to create the Component"},
        isTs: { type: 'boolean', alias: 'ts', description: "Should generate typescript files"},
        isScss: { type: 'boolean', alias: 'scss', description: "Should generate Scss style"}
    })
    .positional('name', { type: 'string', description: "Name of the Component to create"})

export const handler = (argv: Arguments<Options>): void => {
    const root = findRootSync(process.cwd())

    if (!argv.isTs) argv.isTs = containFiles(root, [".tsx", ".ts"])
    if (!argv.isScss) argv.isScss = containFiles(root, ".scss")  
    if (!argv.name) process.exit(1)

    generateFiles(argv)
    updateIndexes(argv)
    
    process.exit(0)
}

const generateFiles = (argv: Arguments<Options>): void => {
    var path = (argv.path) ? argv.path : process.cwd()
    
    var componentName = pascalCase(argv.name)
    var componentDir = join(path, componentName)
    if (existsSync(componentDir)) {
        console.log(`Cannot create component, a directory with name: ${componentName} already exists !`)
        process.exit(1)
    } else mkdirSync(componentDir) //Create component Directory

    //Main component file
    var componentFile = join(componentDir, `${componentName}.${argv.isTs ? 'tsx' : 'jsx'}`)
    var componenrFileContent = generateComponentContent(argv)
    writeFileSync(componentFile, componenrFileContent)

    //Component Style file
    var componentStyleFile = join(componentDir, `${componentName}.${argv.isScss ? 'scss': 'css'}`)
    writeFileSync(componentStyleFile, "")

    //Component Story file
    var componentStoryFile = join(componentDir, `${componentName}.stories.${argv.isTs ? 'tsx' : 'jsx'}`)
    var componentStoryFileContent = generateComponentStoryContent(argv)
    writeFileSync(componentStoryFile, componentStoryFileContent)

    //Component Test file
    var componentTestFile = join(componentDir, `${componentName}.test.${argv.isTs ? 'tsx' : 'jsx'}`)
    var componentTestFileContent = generateComponentTestContent(argv)
    writeFileSync(componentTestFile, componentTestFileContent)

    //Index file
    var componentIndexFile = join(componentDir, `index.${argv.isTs ? 'ts' : 'js'}`)
    var componentIndexFileContent = generateComponentIndexContent(argv)
    writeFileSync(componentIndexFile, componentIndexFileContent)
}

const updateIndexes = (argv: Arguments<Options>): void => {
    var path = (argv.path) ? argv.path : process.cwd()

    var indexPath = join(path, `index.${argv.isTs ? 'ts' : 'js'}`)
    var indexContent = formatString(`export { default as {0} } from "./{0}"`, pascalCase(argv.name))
    if (existsSync(indexPath)) appendFileSync(indexPath, indexContent)
    else writeFileSync(indexPath, indexContent)
}

const containFiles = (startPath:string, filter: string | string[]): boolean => {
    var res = false;

    if (!existsSync(startPath)) return false
    var files = readdirSync(startPath)
    files.forEach((file) => {
        if (res) return res
        var filename = join(startPath, file)  
        var stat = lstatSync(filename)
        if (stat.isDirectory() && !shouldExclude(file)) res = containFiles(filename, filter)
        else {
            if ((typeof filter) == 'string') res = (filename.indexOf(filter as string) >= 0)
            else res = (filter as string[]).map((f) => (filename.indexOf(f) >= 0)).includes(true)
        }
    })

    return res;
}

const shouldExclude = (file:string): boolean => {
    const excludeDir = ["node_modules", "build", "bin", "lib"]
    if (file[0] == '.') return true
    if (excludeDir.indexOf(file) != -1) return true
    return false;
}

const formatString = (str: string, ...val: string[]): string => {
    var result = str
    val.forEach((value, index) => result = result.replace(new RegExp(`\\{${index}}`, 'g'), value))
    return result
}

const generateComponentContent = (argv: Arguments<Options>): string => {
    return formatString((argv.isTs) ? componentContent.ts : componentContent.js,
        pascalCase(argv.name),
        (argv.isScss) ? "scss" : "css"
    )
}

const componentContent = {
    ts: `import React from "react"\nimport "./{0}.{1}"\n\nexport interface {0}Props {\n\t//complete your custom props here\n}\n\nconst {0} = (props: {0}Props) => {\n\treturn <></>\n}\n\nexport default {0}`,
    js: `import React from 'react';\nimport PropTypes from 'prop-types';\nimport "./{0}.{1}";\n\nexport const {0} = ({ ...props }) => {\n\treturn <></>;\n};\n\n{0}.propTypes = {\n\t//Add custom propTypes\n};\n\n{0}.defaultProps = {\n\t//Add default props values\n};`
}

const generateComponentStoryContent = (argv: Arguments<Options>): string => {
    return formatString((argv.isTs) ? componentStoryContent.ts : componentStoryContent.js, pascalCase(argv.name))
}

const componentStoryContent = {
    ts: `import React from "react"\nimport { ComponentStory, ComponentMeta } from "@storybook/react"\nimport {0} from "./{0}"\n\nexport default {\n\ttitle: "PorfolioComponentLibrary/{0}",\n\tcomponent: {0},\n} as ComponentMeta<typeof {0}>\n\nconst Template: ComponentStory<typeof {0}> = (args) => <{0} {...args} />\n\n//Stories\nexport const BasicStory = Template.bind({})\nBasicStory.args = {\n\t//Add props values for this story\n}`,
    js: `import React from 'react';\nimport { {0} } from './{0}';\n\nexport default {\n\ttitle: 'PorfolioComponentLibrary/{0}',\n\tcomponent: {0},\n\t// More on argTypes: https://storybook.js.org/docs/react/api/argtypes\n\targTypes: {\n\t\t//Add Custom argTypes here\n\t},\n};\n\nconst Template = (args) => <{0} {...args} />;\n\n//Stories\nexport const BasicStory = Template.bind({});\nBasicStory.args = {\n\t//Add props values for this story\n};`
}

const generateComponentTestContent = (argv: Arguments<Options>): string => {
    return formatString((argv.isTs) ? componentTestContent.ts : componentTestContent.js, pascalCase(argv.name))
}

const componentTestContent = {
    ts: `import React from "react"\nimport { render } from "@testing-library/react"\n\nimport {0} from "./{0}"\n\ndescribe("{0}", () => {\n\ttest("renders the {0} component", () => {\n\t\trender(<{0} />)\n\t})\n})`,
    js: `//javascript component test here`
}

const generateComponentIndexContent = (argv: Arguments<Options>): string => {
    return formatString((argv.isTs) ? componentIndexContent.ts : componentIndexContent.js, pascalCase(argv.name))
}

const componentIndexContent = {
    ts: `export { default } from "./{0}"`,
    js: `//javascript index here`
}