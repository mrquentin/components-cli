import type { Arguments, CommandBuilder } from "yargs";
import { findRootSync } from "@manypkg/find-root";
import yargs from "yargs";
import { existsSync, lstatSync, readdirSync } from "fs";
import { join } from "path";

type Options = {
    name: string,
    path: string
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

    generateFiles()
    updateIndexes()
    
    process.exit(0)
}

const generateFiles = (): void => {

}

const updateIndexes = (): void => {

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