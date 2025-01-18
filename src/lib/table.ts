import { removeColour } from "./colour";

export const table = (cells: string[][], columns: number, padding = 5) => {
	// cells is a 2d array. first array is rows. second array is cells in row
	// so to get the columns, you iterate over some fixed column cells[i][fixed]

	// get the number of columns per row
	const columnsInRow = cells[0].length;

	// get the length of longest string in each column
	const columnSizes = [];

	// iterate over the columns
	for (let columnIndex = 0; columnIndex < columnsInRow; columnIndex++) {
		// then then rows
		let size = 0;
		for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
			size =
				cells[rowIndex][columnIndex]?.length > size
					? cells[rowIndex][columnIndex].length
					: size;
		}

		columnSizes.push(size);
	}

    // TODO: if columnSizes totals > columns, iteratively reduce until <= columns

	let out = "";
	for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
		const row = cells[rowIndex];
		for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
			const cell = cells[rowIndex][columnIndex];

			const colourless = removeColour(cell) ?? "";

			const columnSize = columnSizes[columnIndex];

			out += (cell ?? "") + " ".repeat(columnSize - colourless.length + padding);
		}

        out += "\n";
	}

	return out;
};
