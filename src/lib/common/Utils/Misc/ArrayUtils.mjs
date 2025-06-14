export default class ArrayUtils {

    /**
    * Method to enclose array values
    * 
    * @param {array} array
    * @param {string} prefix default '['
    * @param {string} suffix default ']'
    * @returns {array}
    * 
    */
    static arrayValuesEnclose = (array, prefix = '[', suffix = ']') => {
        return array.map(title => prefix + title + suffix)
    }

    /**
     * Method to find the differences between two arrays
     *
     * @param {array} oldArray
     * @param {array} newArray
     * @returns {object}
     * 
     * new: Values that exists in newArray but do not exists in oldArray
     * removed: Values that exists in oldArray but do not exists in newArray
     * unchanged: Values common in oldArray and newArray
     * 
     */
    static arrayDiff = (oldArray, newArray) => {

        const changes = { 'new': [], 'removed': [], 'unchanged': [] }
        changes.new = newArray.filter(element => !oldArray.includes(element)).sort()
        changes.unchanged = newArray.filter(element => oldArray.includes(element)).sort()
        changes.removed = oldArray.filter(element => !newArray.includes(element)).sort()
        return changes

    } // arrayDiff

    /**
    * Method to split an array to chunks of a given size
    * 
    * @param {array} array
    * @param {number} size
    * @returns {array}
    * 
    */
    static arrayChunk(array, size) {
        return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
            array.slice(index * size, index * size + size)
        );
    } // arrayChunk


} // ArrayUtils