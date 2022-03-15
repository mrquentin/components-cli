import { Arguments, CommandBuilder, commandDir } from "yargs";
import { findRootSync } from "@manypkg/find-root";
import { existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
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
    updateIndexes()
    
    process.exit(0)
}

const generateFiles = (argv: Arguments<Options>): void => {
    var path = (argv.path) ? argv.path : process.cwd()
    
    var componentName = pascalCase(argv.name)
    var componentDir = join(path, componentName)
    mkdirSync(componentDir) //Create component Directory

    //Main component file
    var componentFile = join(componentDir, `${componentName}.${argv.isTs ? 'tsx' : 'js'}`)
    var componenrFileContent = (argv.isTs) ? componentContent.ts: componentContent.js
    writeFileSync(componentFile, componenrFileContent)

    //Component Style file
    var componentStyleFile = join(componentDir, `${componentName}.${argv.isScss ? 'scss': 'css'}`)
    writeFileSync(componentStyleFile, "")

    //Component Story file
    var componentStoryFile = join(componentDir, `${componentName}.stories.${argv.isTs ? 'tsx' : 'js'}`)
    var componentStoryFileContent = (argv.isTs) ? componentStoryContent.ts: componentStoryContent.js
    writeFileSync(componentStoryFile, componentStoryFileContent)

    //Component Test file
    var componentTestFile = join(componentDir, `${componentName}.test.${argv.isTs ? 'tsx' : 'js'}`)
    var componentTestFileContent = (argv.isTs) ? componentTestContent.ts: componentTestContent.js
    writeFileSync(componentTestFile, componentTestFileContent)

    //Index file
    var componentIndexFile = join(componentDir, `index..${argv.isTs ? 'ts' : 'js'}`)
    var componentIndexFileContent = (argv.isTs) ? componentIndexContent.ts: componentIndexContent.js
    writeFileSync(componentIndexFile, componentIndexFileContent)
}

const updateIndexes = (): void => {
    //TODO: implement index update
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

const componentContent = {
    ts: `//typescript component here`,
    js: `//javascript component here`
}

const componentStoryContent = {
    ts: `//typescript component story here`,
    js: `//javascript component story here`
}

const componentTestContent = {
    ts: `//typescript component test here`,
    js: `//javascript component test here`
}

const componentIndexContent = {
    ts: `//typescript index here`,
    js: `//javascript index here`
}