
class TableGuy {

	constructor(table, options={}) {
		this.table = table;
		this.parent = this.table.parentNode;

		this.tableBody = table.querySelector('tbody');
		this.tableHead = table.querySelector('thead');
		//tableRows is an array for <tr> elements
		this.tableRows = this.tableBody.children;
		//table headers is a list of <th> elements
		this.tableHeaders = this.tableHead.children[0].children;
		this.tableFilterRow;
		this.numberOfColumns = this.tableHeaders.length;

		this.filterExcludes = [];
		this.currentFilters = [];
		this.totalFilters = 0;

		//Sort Settings
		this.dateCols = [];

		//Paginator Settings
		this.pageSize = 25;
		this.currentPage = 1;
		this.pageNumbers = [];
		this.numberOfPages = 0;

		this.enableFilter = true;
		this.enableSort = true;
		this.enableSearch = true;
		this.enablePagination = true;
		this.enableAdvanceSearch = true;

		for (let key in options) {
			if (this.hasOwnProperty(key)) {
				this[key] = options[key]
			}
		}

		this.initialize();

	}

	initialize() {
		if (this.enableFilter) {
			this.initializeFilter();
		}

		if (this.enableSort) {
			this.initializeSort();
		}

		if (this.enableSearch) {
			this.initializeSearch();
		}

		if (this.enablePagination) {
			this.initializePaginator();
		}
	}

	initializePaginator() {
		if (this.enablePagination) {
			this.paginatorCreatePageNumbers();
		}
	}

	initializeFilter() {
		let tableHeaders = Array.from(this.tableHeaders);

		// Create the row where filters will live
		let filterRow = document.createElement('tr');
		filterRow.id = 'filter-row';

		// Create a cell for each column to hold filter select
		for (let i=0; i<tableHeaders.length; i++) {
			let td = document.createElement('td');
			filterRow.appendChild(td);
		}

		// Create a matrix representation of the table
		// Structure [[1, 2, 3], [4, 5, 6]]
		let matrix = []

		for (let i=0; i < tableHeaders.length; i++) {
			matrix.push([]);
			if (!(this.filterExcludes.includes(i))) {
				for (let j = 0; j < this.tableRows.length; j++) {
					// Iterate over ever row in the table and get the value for col i
					let row = this.tableRows[j];
					let value;
					let s = null;
					// Strip tags for raw value
					let cell = row.children[i].cloneNode(true);
					try {
						s = cell.querySelector('select');
						if (s != null) {
							value = s.options[s.selectedIndex].innerHTML
						} else {
							value = stripTags(cell.innerHTML).trim();
						}
					} catch (error) {	
						value = stripTags(cell.innerHTML).trim();
					}
					
					if (value != undefined) {
						if (s != null && value.length == 0) {
							value = " "
						}

						if (value.length > 0) {
							matrix[i].push(value);
						}
					}
				}
			}
			// Get unique values for each column in the table and sort
			matrix[i] = Array.from(new Set(matrix[i])).sort((a, b) => a.localeCompare(b));
		}

		// Create a select box (and options) for each header
		for (let i=0; i < matrix.length; i++) {
			let select = document.createElement('select');
			// Create default value for the select
			let blankOption = document.createElement('option');
			blankOption.selected = "selected";
			blankOption.value = "";
			blankOption.innerHTML = "-----";
			select.appendChild(blankOption);


			for (let j=0; j < matrix[i].length; j++) {
				// Create option for each of the unique values
				let value = matrix[i][j];
				let option = document.createElement('option');
				option.innerHTML = value;
				option.value = value;
				select.appendChild(option)
			}
			select.classList.add('form-control');

			select.addEventListener('change', this.setCurrentFilter)

			if (matrix[i].length > 0) {
				// Only append select box if there's values in column (wasn't on exclude list)
				filterRow.children[i].appendChild(select);
			}
		}

		this.tableFilterRow = filterRow;

		this.tableBody.insertBefore(filterRow, this.tableBody.children[0])

		if (localStorage[window.location.href] !== undefined) {
			this.currentFilters = JSON.parse(localStorage[window.location.href])['tableFilters'];
			this.currentFilters.map(x => filterRow.children[x.index].children[0].value = x.value)
			this.totalFilters = this.currentFilters.length;
			this.searchTable({'type':'search'}, '')
		}
	}

	addTableFilterRow() {
		this.tableBody.insertBefore(this.tableFilterRow, this.tableBody.children[0])
	}

	updateFilterOptions() {
		let headerNames = Array.from(this.tableHeaders);
		
		let skipArr = this.currentFilters.map(x => x.index);
		let rows = Array.from(this.tableRows);
		let filterRow = rows.shift()

		let selectedInputs = [];

		for (let i = 0; i < headerNames.length; i++) {
			let input = filterRow.children[i].querySelector('select')
			if (input) {
				let val = input.options[input.selectedIndex].value
				if (val !== "" && !(skipArr.includes(i))) {
					selectedInputs.push({'index':i, 'value':input.options[input.selectedIndex].value})
				}
				if (!(skipArr.includes(i))) {
					input.innerHTML = '';
					input.remove();
				}
			}
		}

		let matrix = []

		for (let i=0; i < headerNames.length; i++) {
			matrix.push([]);
			if (!(this.filterExcludes.includes(i))) {
				for (let j = 0; j < rows.length; j++) {
					let row = rows[j];
					if (!(row.classList.contains('d-none'))) {
						let row = this.tableRows[j];
						let value;
						let s = null;
						// Strip tags for raw value
						let cell = row.children[i].cloneNode(true);
						try {
							s = cell.querySelector('select');
							if (s != null) {
								value = s.options[s.selectedIndex].innerHTML
							} else {
								value = stripTags(cell.innerHTML).trim();
							}
						} catch (error) {	
							value = stripTags(cell.innerHTML).trim();
						}
						
						if (value != undefined) {
							if (s != null && value.length == 0) {
								value = " "
							}
	
							if (value.length > 0) {
								matrix[i].push(value);
							}
						}
					}
				}
			}
			matrix[i] = Array.from(new Set(matrix[i])).sort((a, b) => a.localeCompare(b));
		}

		for (let i=0; i < matrix.length; i++) {
			if (!(skipArr.includes(i))) {
				let select = document.createElement('select');
				let blankOption = document.createElement('option');
				blankOption.selected = "selected";
				blankOption.value = "";
				blankOption.innerHTML = "-----";
				select.appendChild(blankOption);


				for (let j=0; j < matrix[i].length; j++) {
					let value = matrix[i][j];
					let option = document.createElement('option');
					option.innerHTML = value;
					option.value = value;
					if (selectedInputs.map(x => x.index).includes(i)) {
						
						if (option.value === selectedInputs[selectedInputs.map(x => x.index).indexOf(i)].value) {
							blankOption.removeAttribute('selected');
							option.selected = 'selected';
						}
					}
					select.appendChild(option)
				}
				select.classList.add('form-control');

				select.addEventListener('change', this.setCurrentFilter)

				if (matrix[i].length > 0) {
					filterRow.children[i].appendChild(select);
				}
			}
		}	
	}

	initializeSort() {
		if (this.tableHead) {
			for (let num = 0; num < this.tableHeaders.length; num++) {
				this.tableHeaders[num].addEventListener('click', this.sortTableByColumn);
			}
		}
	}

	removeSortDirection(column) {
		for (let i = 0; i < this.tableHeaders.length; i++) {
			if (i !== column && this.tableHeaders[i].classList.contains('reverse')) {
				this.tableHeaders[i].classList.remove('reverse')
			}
		}	
	}

	initializeSearch() {
		let child = this.table;
		let parent = this.table.parentNode;
		if (parent.classList.contains('table-responsive')) {
			child = parent;
			parent = parent.parentNode;
		}

		let search = document.createElement('input');
		search.type = 'search';
		search.classList.add('form-control', 'col-md-4', 'float-right', 'mb-2');
		search.placeholder = 'Search...';

		search.addEventListener('search', this.searchEventHandler);

		parent.insertBefore(search, child);
	}

	searchEventHandler = (event) => {
		let query = event.target.value;
		this.searchTable(event, query);
	}

	setCurrentFilter = (event) => {
		//select position in row that the selects th element is. th == event.target.parentNode
		let column = Array.from(event.target.parentNode.parentNode.children).indexOf(event.target.parentNode);
		let currentColumns = this.currentFilters.map(x => x.index);
		let value = event.target.options[event.target.selectedIndex].value;

		if (value !== "") {
			if (!(currentColumns.includes(column))) {
				this.currentFilters.push({'index':column, 'value':event.target.options[event.target.selectedIndex].value})
			} else {
				for (let i = 0; i < this.currentFilters.length; i++) {
					if (this.currentFilters[i].index == column) {
						this.currentFilters[i].value = event.target.options[event.target.selectedIndex].value
					}
				}
			}
		} else {
			if (currentColumns.includes(column)) {
				for (let i = 0; i < this.currentFilters.length; i++) {
					if (this.currentFilters[i].index == column) {
						this.currentFilters.splice(i, 1);
					}
				}
			}
		}
		
		localStorage[window.location.href] = JSON.stringify({'tableFilters': this.currentFilters})
		
		this.totalFilters = this.currentFilters.length
		this.searchTable(event, "", column);
		this.updateFilterOptions();

		if (this.enablePagination) {
			this.paginatorResetPageNumbers()
		}
	}

	createTableMatrix() {
		let matrix = [];

		for (let i = 0; i < this.numberOfColumns; i++) {
			matrix.push([]);
		} 
		//iterate over each row
		for (let i = 0; i < this.tableRows.length; i++) {
			let currentRow = this.tableRows[i];
			//iterate over eaech column in the row
			for (let j = 0; j < this.numberOfColumns; j++) {
				let value;
				let s = null;
				let cell = currentRow.children[j].cloneNode(true)
				
				try {
					s = cell.querySelector('select');
					if (s != null) {
						value = s.options[s.selectedIndex].innerHTML
					} else {
						value = stripTags(cell.innerHTML).trim();
					}
				} catch (error) {	
					value = stripTags(cell.innerHTML).trim();
				}
				
				if (value != undefined) {
					if (s != null && value.length == 0) {
						value = " "
					}

					if (value.length > 0) {
						matrix[j].push(value);
					}
				}
			}
		}

		return matrix
	}

	searchTable(event, query, columnNumber=null, logic="equal") {
		if (columnNumber !== null || event.type == 'search') {
			let indexes = [];

			let isFiltered = this.totalFilters > 0;

			let matrix = this.createTableMatrix();

			let currentFilters = [];
			let passFilterList = [];

			//for as many columns that there are
			for (let i = 0; i < this.numberOfColumns; i++) {

				//for each each value in the matrix for that column
				for (let j = 0; j < matrix[i].length; j++) {

					let cellValue = matrix[i][j];
					//Matrix should look like [[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]
					//check to see if search value is in the cell
					if (logic == "equal" && ((columnNumber === null && cellValue.toLowerCase().indexOf(query.toLowerCase()) > -1) || cellValue === query || query === "")) {
						//push the row number to a good indices list
						indexes.push(j)
					} else if (logic.indexOf("lt") > -1 && cellValue < query) {
						if (logic == "lte" && cellValue == query) {
							indexes.push(j)
						}
						//push the row number to a good indices list
						indexes.push(j)
					} else if (logic.indexOf("gt") > -1 && cellValue > query) {
						if (logic == "gte" && cellValue == query) {
							indexes.push(j)
						}
						//push the row number to a good indices list
						indexes.push(j)
					} else if (logic == 'contains' && cellValue.indexOf(query) > -1) {
						//push the row number to a good indices list
						indexes.push(j)
					} else if (logic == 'notcontains' && cellValue.indexOf(query) < 0) {
						//push the row number to a good indices list
						indexes.push(j)
					} else if (logic == 'notcontains' && cellValue.indexOf(query) < 0) {
						//push the row number to a good indices list
						indexes.push(j)
					} else if (logic == 'notequal' && cellValue !== query) {
						//push the row number to a good indices list
						indexes.push(j)
					}

					if (isFiltered) {
						for (let x = 0; x < this.currentFilters.length; x++) {
							if (i === this.currentFilters[x].index) {

								if (cellValue === this.currentFilters[x].value) {
									passFilterList.push(j)
								}
							} 
						}
					}
				}
			}

			let totalFilters = this.totalFilters;

			passFilterList = Array.from(new Set(passFilterList.filter(function(x) {
				return passFilterList.filter(y => y == x).length === totalFilters
			})))

			console.log(passFilterList.length)

			var matchSearches = Array.from(new Set(indexes));

			if (isFiltered) {
				matchSearches = matchSearches.filter(x => passFilterList.includes(x));
			}

			for (let i = 0; i < this.tableRows.length; i++) {
				if (this.enableFilter && i === 0) {
					continue
				}

				if (!(matchSearches.includes(i))) {
					if (!(this.tableRows[i].classList.contains('d-none'))) {
						this.tableRows[i].classList.add('d-none')
					}
				} else {
					if (this.tableRows[i].classList.contains('d-none')) {
						this.tableRows[i].classList.remove('d-none');
					}
				}
			}
			this.paginatorResetPageNumbers();
		}
	}

	sortTableByColumn = () => {
		// Get the header index from the thead row
		let column = Array.from(event.target.parentNode.children).indexOf(event.target);

		let reverse = this.tableHeaders[column].classList.contains('reverse')

		//toggle the 'reverse' class to indicate direction
		this.tableHeaders[column].classList.toggle('reverse');

		let rows = Array.from(this.tableRows);

		var newCols = [];

		let filterRow = this.enableFilter;

		if (filterRow) {
			filterRow = rows.shift();
		}

		var cols = rows.map((n, index) => [index, stripTags(n.children[column].innerHTML).replace('$', '').trim()]);
		
		if (this.dateCols.indexOf(column) > -1) {
			cols = cols.map(x => [x[0], new Date(x[1])])
		}

		cols = cols.sort(sortSecondElem)
		for (let i = 0; i < cols.length; i++) {
			newCols.push(rows[cols[i][0]])
		}

		if (reverse) {
			newCols.reverse();
		}

		this.tableBody.innerHTML = '';

		if (filterRow) {
			newCols.unshift(filterRow);
		}

		for (let i = 0; i < newCols.length; i++) {
			this.tableBody.appendChild(newCols[i]);
		}

		this.removeSortDirection(column);
		this.paginatorResetPageNumbers()
	}

	initalizePaginator() {
		this.paginatorCreatePageNumbers();
	}

	paginatorHidePages() {
		let rows = this.paginatorGetRows();
		for (let i = 0; i < rows.length; i++) {
			rows[i].style.display = 'none';
		}
	}

	paginatorShowPages() {
		let base = this.pageSize * (this.currentPage - 1)
		let rows = this.paginatorGetRows().slice(base, base + this.pageSize)

		for (let i = 0; i < rows.length; i++) {
			rows[i].style.display = 'table-row';
		}
	}

	paginatorViewPage() {
		this.paginatorHidePages();
		this.paginatorShowPages();
		if (this.numberOfPages > 1) {
			this.paginatorSetPageNumber();
			this.updateFilterOptions();
			console.log(`setting page number to ${this.currentPage}`)
		}
	}

	paginatorChangePage(page) {
		this.currentPage = page;
		this.paginatorViewPage();
	}

	paginatorGetRows() {
		let rows = [];
		let tableRows = Array.from(this.tableRows)
		for (let i =0; i < tableRows.length; i++) {
			//check if row is visible
			if (!(tableRows[i].classList.contains('d-none'))) {
				rows.push(tableRows[i])
			}
		}
		return rows;
	}

	paginatorGoToPage = (evt) => {
		let newPage = parseInt(evt.target.dataset.page);
		this.paginatorChangePage(newPage)
	}

	paginatorSetPageNumber() {
		for (let i in this.pageNumbers) {
			if (this.pageNumbers[i].classList.contains('btn-primary')) {
				this.pageNumbers[i].classList.remove('btn-primary');
			}
		}
		console.log(`setting index ${this.currentPage - 1}`, this.pageNumbers)
		if (this.pageNumbers.length > 0) {
			this.pageNumbers[this.currentPage - 1].classList.add('btn-primary');
		}
	}

	paginatorResetPageNumbers() {
		if (this.table.parentNode.children.length > 1) {
			this.table.parentNode.removeChild(this.table.parentNode.lastChild);
			this.pageNumbers = [];
		}

		this.currentPage = 1;
		this.paginatorCreatePageNumbers();
		this.paginatorSetPageNumber();
	}

	paginatorCalculateNumberOfPages() {
		let rows = this.paginatorGetRows();
		let numberOfPages = Math.ceil(rows.length/this.pageSize);
		return numberOfPages
	}

	paginatorCreatePageElements() {
		let nav = this.parent.querySelector("#tableguyPages");
		this.pageNumbers = [];
		if (!(nav)) {
			nav = document.createElement('nav');
			nav.id = 'tableguyPages';
		} else {
			nav.innerHTML = "";
		}

		let pageNumberList = document.createElement('ul');
		pageNumberList.classList.add('list-unstyled', 'text-center', 'mb-1');

		for (let i = 0; i < this.numberOfPages; i++) {
			let page = document.createElement('li');
			page.style.display = 'inline-block';
			page.classList.add('btn', 'btn-sm');
			if (i + 1 == this.currentPage) {
				page.classList.add('btn-primary');
			}
			page.addEventListener('click', this.paginatorGoToPage);
			page.innerHTML = i + 1;
			page.dataset.page = i + 1;

			pageNumberList.appendChild(page);

			this.pageNumbers.push(page);
		}

		nav.appendChild(pageNumberList);
		this.parent.appendChild(nav);
	}

	paginatorCreatePageNumbers() {
		this.numberOfPages = this.paginatorCalculateNumberOfPages();
		// Create the DOM elements and add them to the parentNode
		this.paginatorCreatePageElements();
		this.paginatorViewPage();
	}

}

function stripTags(html){
	let doc = new DOMParser().parseFromString(html, 'text/html');
	return doc.body.textContent || "";
}

function isNumeric(input){
    var RE = /^-{0,1}\d*\.{0,1}\d+$/;
    return (RE.test(input));
}

function sortFirstElem(a, b) {

}

function sortSecondElem(a, b) {
	if (a[1] instanceof Date) {
		return a[1] - b[1]
	}
	if (isNumeric(a[1].replace(/,/g, ''))) {
		return parseFloat(a[1].replace(/,/g, '')) - parseFloat(b[1].replace(/,/g, '')) 
	}
	return a[1].localeCompare(b[1]);
}

