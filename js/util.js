const getId = id => document.getElementById(id)

const ready = callback => {
		document.readyState === "interactive" ||
		document.readyState === "complete" 
			? callback() 
			: document.addEventListener("DOMContentLoaded", callback);
}
