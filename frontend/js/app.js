async function FetchData() {
  const res = await fetch("/api/home-content");
  const data = await res.json();
  // document.getElementById("main").innerHTML = data.html
  const sayhi = document.createElement("p")
  sayhi.textContent = `hello, ${data.name}`
  const test = `<div>Hello, ${data.name}</div>`
  document.getElementById("app").innerText += test
  document.getElementById("app").append(sayhi)
  console.log(data);
}
FetchData();
