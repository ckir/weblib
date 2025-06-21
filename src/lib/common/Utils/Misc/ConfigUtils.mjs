export default class ConfigUtils {

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