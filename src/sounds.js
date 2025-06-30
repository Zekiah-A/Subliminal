const clientPackets = {
	SyncHost: 0,
	SyncZombie: 1,
	UnsyncZombie: 2,
	Play: 3,
	Time: 4,
	Lyrics: 5,
	Search: 6,
	Purgatory: 7,
	Approve: 8,
	Veto: 9,
	SearchRandom: 10,
	SongInfo: 11
}

const serverPackets = {
	StartPlay: 0,
	EndPlay: 1,
	SetInfo: 2,
	SetTime: 3,
	Purgatory: 4,
	Random: 5,
	Lyrics: 6
}

// Card grids, such as those inheriting home-cards-grid css class
const socket = new WebSocket(localStorage.soundsServer || "wss://server.poemanthology.org:80")
let lyricCanvasCount = 0

//This gives us the seconds from a subliminal (max hour mins seconds) lyric time 
let lyricTimeToSecs = lyTime => 
	lyTime.split(":",3) //1. split by ':'                       
	.map(lyTime => Number(lyTime)) //2. convert items to nunbers ("" converts to 0)
	.reduce((total, current) => total * 60 + current, 0) //3. starting left, read number, add to total * 60

function lyricFileToElements(lyrics) {
	let lines = lyrics.split("\n"), elements = [], elementsF = []

	for (let i = 0; i < lines.length; i++) {
		let line = lines[i]

		//Skip all blank or comment lines
		if (!line.trim() || line[0] == "#") continue

		//Get the milliseconds from the time stamp at the start of the lyric
		let milliseconds = lyricTimeToSecs(line.split(" ")[0]) * 1000

		let el = document.createElement("span")
		let formatted = line.substring(line.indexOf(" ") + 1)
		//TBC: test if str.split(' ').slice(1).join(' ') faster

		el.setAttribute("time", milliseconds)
		el.setAttribute("status", "later")

		//specific patches for line types
		switch (formatted[0]) {
			//lyric line is an addition
			case "+":
				el.setAttribute("mode", "addition")
				formatted = formatted.replace("+", "")
				break
			//lyric line is a graphic
			case "!":
				el.setAttribute("mode", "graphic")
				formatted = formatted.replace("!", "")
				break
			//lyric line mode is a normal line, but it starts with a special character that must be escaped
			case "\\":
				formatted = formatted.replace("\\", "")
				if (i != 0) elements.push(document.createElement("br"))
				break
			default:
				if (i != 0) elements.push(document.createElement("br"))
				break
		}

		el.innerText = formatted
		elements.push(el)
	}

	return elements
}


function renderDiscoBall(sphere = null) {
	let canvas = newLyricCanvas()
	const ctx = canvas.getContext("2d")

	sphere ??= {
		centreX: canvas.width / 2,
		centreY: canvas.height / 2,
		radius: 200,
		speed: -10,
		density: 5
	}

	let time = 0
	let particles = []

	let renderTick = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		let tick = time / 100

		for (let i = 0; i < particles.length; i++) {
			let circle = new Path2D()

			//Find the x offset (radius) of the current ring of tye sphere that this point is on
			let r = Math.acos(particles[i].offsetY / (sphere.radius * 2)) / Math.PI
			let ringRadius = Math.abs((sphere.radius * 2) * Math.sin(Math.PI * r))
			
			//Combine the initial radius, radius of ring particle is on (inverse distance from camera), and it's current X (pos in 3D) to get final radius
			let radius = (Math.sin(tick + particles[i].tickOffsetX) + 1) * particles[i].initialRadius * ringRadius
			
			circle.arc(
				sphere.centreX + ringRadius * Math.cos(tick + particles[i].tickOffsetX), //X
				particles[i].offsetY + sphere.centreY, //Y //sphere.offsetY + sphere.radius * (Math.cos(particles[i].initialY) + 1)
				radius,//radius,
				0, //Drawing stuff
				2 * Math.PI, //Drawing stuff
				false //Drawing stuff
			)
			ctx.fillStyle = particles[i].colour
			ctx.fill(circle)
		}

		time += sphere.speed
	}

	for (let y = -400; y < 400; y += 10) { //used for positioning
		for (let x = 0; x < sphere.density; x++) { //used for populating
			particles.push({
				colour: ['white', 'gray', 'lightgray'][Math.floor(Math.random() * 3)],
				offsetY: y,
				tickOffsetX: Math.random() * 1000,
				initialRadius: .05
			})
		}
	}

	setInterval(renderTick, 16)
}

const tilesEffectModes = {
	Random : 1,
	Crawl: 2,
	Circle: 3
}

function renderTilesEffect(tiles = null) {
	let canvas = newLyricCanvas()
	const ctx = canvas.getContext("2d")
	
	tiles ??= {
		frequency: 100,
		sizeX: 100,
		sizeY: 100,
		mode: tilesEffectModes.Random
	}

	let crawl = 0

	let renderTick = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		
		switch (tiles.mode) {
			case tilesEffectModes.Random:
				for (let x = 0; x < this.innerWidth / tiles.sizeX; x++) {
					for (let y = 0; y < this.innerHeight / tiles.sizeY; y++) {
						ctx.fillStyle = `rgb(${Math.floor(Math.random() * 256) + 1},${Math.floor(Math.random() * 256) + 1},${Math.floor(Math.random() * 256) + 1})`
						ctx.fillRect(x * tiles.sizeX, y * tiles.sizeY, tiles.sizeX, tiles.sizeY)
					}
				}
				break
			case tilesEffectModes.Crawl:
				let maxX = this.innerWidth / tiles.sizeX
				let maxY = this.innerHeight / tiles.sizeY
				for (let x = 0; x < maxX; x++) {
					for (let y = 0; y < maxY; y++) {
						ctx.fillStyle = `rgb(${Math.floor(Math.random() * 256) + 1},${Math.floor(Math.random() * 256) + 1},${Math.floor(Math.random() * 256) + 1})`
						if (crawl % maxX > x && crawl / maxY > y) {
							ctx.fillRect(x * tiles.sizeX, y * tiles.sizeY, tiles.sizeX, tiles.sizeY)
						}
					}
				}
				crawl++
				break
			
		}
	}

	setInterval(renderTick, tiles.frequency)

}

function resizeLyricCanvases() {
	for (let i = 0; i < lyricsCanvases.children.length; i++) {
		lyricsCanvases.children[i].width = lyricsCanvases.children[i].offsetWidth
		lyricsCanvases.children[i].height = lyricsCanvases.children[i].offsetHeight
	}
}

function newLyricCanvas() {
	let canvas = document.createElement("canvas")
	canvas.id = ++lyricCanvasCount
	lyricsCanvases.appendChild(canvas)
	resizeLyricCanvases()
	return canvas
}

async function initialise() {
	//Setup UI
	addEventListener("resize", resizeLyricCanvases, false)
	addEventListener("orientationchange", resizeLyricCanvases, false)

	//Set page to home page
	window.location.hash = "#home"
}

//Site scripts
initialise()
