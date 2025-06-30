function viewPurgatoryReports() {
	while (optionContent.firstChild) {
		optionContent.removeChild(optionContent.firstChild)
	}

	optionContent.animate([
		{ maxHeight: '0' },
		{ maxHeight: '500' }
	], {
		duration: 200,
		iterations: 1
	})

	for (let i = 0; i < 10; i++)
	{
		let url = "poemanthology.org/"
		let reason = "Lorem ipsum dolor sit amet"

		let el = document.createElement("div")
		el.style.background = randomColour()
		el.style.marginBottom = "4px"
		el.style.borderRadius = "8px"
		el.style.padding = "8px"
		el.innerHTML = `
			<a href=''>View reporter</a>
			<a href="${url}">View reported poem</a>
			<p style="text-decoration: underline">"{NAME}" reported {ID} with reason</p>
			<p>${reason}</p>
			<input type="button" value="Delete report">
		`

		optionContent.appendChild(el)
	}
}

function viewPurgatoryPicks() {
	while (optionContent.firstChild) {
		optionContent.removeChild(optionContent.firstChild)
	}

	optionContent.animate([
		{ maxHeight: '0' },
		{ maxHeight: '500' }
	], {
		duration: 200,
		iterations: 1
	})

	for (let i = 0; i < 10; i++)
	{
		let url = "poemanthology.org/"
		let reason = "Lorem ipsum dolor sit amet"

		let el = document.createElement("div")
		el.style.background = randomColour()
		el.style.marginBottom = "4px"
		el.style.borderRadius = "8px"
		el.style.padding = "8px"
		el.innerHTML = `
			<a href=''>View pick poem</a>
			<span>{TITLE} by {AUTHOR}</span>
			<input type="button" value="Remove pick">
		`

		optionContent.appendChild(el)
	}

	let el = document.createElement("div")
		el.style.borderRadius = "8px"
		el.style.padding = "8px"
		el.innerHTML = `
			<span>Add another pick</span>
			<input type="text" placeholder="Enter pick ID">
			<input type="button" value="Add">
		`

	optionContent.appendChild(el)
}

function randomColour() { 
	return "hsl(" + 360 * Math.random() + ',' +
			(25 + 70 * Math.random()) + '%,' + 
			(85 + 10 * Math.random()) + '%)'
}