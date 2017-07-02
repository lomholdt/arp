const getId = id => document.getElementById(id)

const ready = callback => {
		document.readyState === "interactive" ||
		document.readyState === "complete" 
			? callback() 
			: document.addEventListener("DOMContentLoaded", callback);
}

const show = element => element.style.display = 'block'
const hide = element => element.style.display = 'none'
