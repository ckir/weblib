export default class ConfigUtils {

    /**
     * Async method to find the parent folder name 
     * of the folder containing the 'package.json' file
     *
     * @returns {Promise<string>}
     * 
     */
    async getProjectRootFolder() {

        const path = await import('node:path')
        const url = await import('node:url')
        const fs = await import('node:fs')
        const __filename = url.fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)

        let currentDir = __dirname;
        let packageJsonPath = '';
        const rootDir = path.parse(process.cwd()).root;

        while (currentDir !== rootDir) {
            const potentialPackageJsonPath = path.resolve(currentDir, 'package.json');

            if (fs.existsSync(potentialPackageJsonPath)) {
                packageJsonPath = potentialPackageJsonPath.split(path.sep).at(-2)
                return fs.realpathSync(path.join(packageJsonPath, '..'))
            } else {
                currentDir = path.resolve(currentDir, '..');
            }
        }

    } // getProjectRootFolder    

    static isDebug() {
        if (process.env.DEBUG === 'true') {
            return true;
        }
        return false;
    } // isDebug

    static isProduction() {
        if (process.env.MODE === 'production') {
            return true;
        }
        return false;
    } // isProduction

    static isDevelopment() {
        if (process.env.MODE === 'development') {
            return true;
        }
        return false;
    } // isDevelopment

} // ConfigUtils