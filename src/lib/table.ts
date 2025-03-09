import { removeColour } from "./colour";

export const table = (cells: string[][], columns: number, padding = 5) => {
	// cells is a 2d array. first array is rows. second array is cells in row
	// so to get the columns, you iterate over some fixed column cells[i][fixed]

	// get the number of columns per row
	const columnsInRow = cells[0].length;

	// get the length of longest string in each column
	// c is coloured text, n is colourless
	const columnSizes: Array<{ n: number; c: number }> = [];

	// iterate over the columns
	for (let columnIndex = 0; columnIndex < columnsInRow; columnIndex++) {
		// then then rows
		let size = 0;
		let coloured = 0;
		for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
			const cell = cells[rowIndex][columnIndex];
			const colourless = removeColour(cell) ?? "";
			// size = cell?.length > size ? cell.length : size;
			if (cell?.length > size) {
				coloured = colourless.length;
				size = cell.length;
			}
		}

		columnSizes.push({ c: size + padding, n: coloured + padding });
	}

	// TODO: if columnSizes totals > columns, iteratively reduce until <= columns
	while (columnSizes.reduce((prev, curr) => prev + curr.n, 0) >= columns + padding) {
		const i = columnSizes.findIndex(
			(y) => y.n === Math.max(...columnSizes.map((x) => x.n)),
		);
		columnSizes[i].n--;
		columnSizes[i].c--;
	}

	let out = "";
	for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
		const row = cells[rowIndex];
		for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
			const cell = cells[rowIndex][columnIndex];

			const colourless = removeColour(cell) ?? "";

			const { c: columnSize, n: colourlessSize } = columnSizes[columnIndex];

			const rendered =
				(cell.split("\n")[0]?.slice(0, columnSize) ?? "") +
				" ".repeat(Math.max(colourlessSize - colourless.length, 0));

			out += rendered;
		}

		out += "\n";
	}

	return out;
};
