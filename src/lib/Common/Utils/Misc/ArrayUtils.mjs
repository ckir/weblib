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
	static arrayValuesEnclose(array, prefix = '[', suffix = ']') {
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
	static arrayDiff(oldArray, newArray) {

		const changes = {
			'new': [],
			'removed': [],
			'unchanged': []
		}
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
		return Array.from({
				length: Math.ceil(array.length / size)
			}, (_, index) =>
			array.slice(index * size, index * size + size)
		);
	} // arrayChunk

	/**
	 * Shuffles an array in place using the Fisher-Yates (Knuth) shuffle algorithm.
	 * This algorithm is efficient and produces a truly random permutation of the array.
	 *
	 * @param {Array<any>} array The array to shuffle.
	 * @returns {Array<any>} The shuffled array (modified in place).
	 */
	static arrayShuffle(array) {
		let currentIndex = array.length,
			randomIndex;

		// While there remain elements to shuffle.
		while (currentIndex !== 0) {

			// Pick a remaining element.
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		return array;
	} // arrayShuffle

	/**
	 * Rotates an array by a specified number of positions in a given direction.
	 * This function creates a new array and does not modify the original array.
	 *
	 * @param {Array<any>} arr The array to rotate.
	 * @param {number} shifts The number of positions to shift the elements.
	 * Can be positive for right shifts (default) or negative for left shifts.
	 * If direction is 'left', a positive shifts value will perform left rotation.
	 * If direction is 'right', a positive shifts value will perform right rotation.
	 * @param {string} [direction='right'] The direction of rotation: 'left' or 'right'.
	 * Defaults to 'right' if not specified.
	 * @returns {Array<any>} A new array with elements rotated.
	 */
	static arrayRotate(arr, shifts, direction = 'right') {
		if (!Array.isArray(arr)) {
			throw new TypeError("Input must be an array.");
		}
		if (arr.length === 0 || shifts === 0) {
			return [...arr]; // Return a shallow copy of the original array
		}

		const len = arr.length;
		// Normalize shifts to be within the bounds of array length
		// This handles shifts greater than array length and negative shifts
		let effectiveShifts = shifts % len;

		let rotatedArr;

		if (direction.toLowerCase() === 'left') {
			// For left rotation, if shifts is negative, it's equivalent to right rotation
			// e.g., left shift by -1 is right shift by 1
			// Also, if shifts is positive, it's a direct left shift.
			if (effectiveShifts < 0) {
				effectiveShifts += len; // Convert negative left shift to positive right shift
				// At this point, effectiveShifts represents a right shift amount.
				// A right shift by X is equivalent to a left shift by (len - X).
				const splitPoint = len - effectiveShifts;
				rotatedArr = [...arr.slice(splitPoint), ...arr.slice(0, splitPoint)];
			} else {
				// Standard positive left shift
				const splitPoint = effectiveShifts;
				rotatedArr = [...arr.slice(splitPoint), ...arr.slice(0, splitPoint)];
			}
		} else { // Default to 'right' direction
			// For right rotation, if shifts is negative, it's equivalent to left rotation
			// e.g., right shift by -1 is left shift by 1
			// Also, if shifts is positive, it's a direct right shift.
			if (effectiveShifts < 0) {
				effectiveShifts = len + effectiveShifts; // Convert negative right shift to positive right shift
			}
			// Standard positive right shift
			const splitPoint = len - effectiveShifts;
			rotatedArr = [...arr.slice(splitPoint), ...arr.slice(0, splitPoint)];
		}

		return rotatedArr;
	} // arrayRotate

} // ArrayUtils