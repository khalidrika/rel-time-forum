async function FetchData() {
  const res = await fetch("/api/home-content");
  const data = await res.json();
  // document.getElementById("main").innerHTML = data.html
  const sayhi = document.createElement("p")
  const test = `<h2>Hello, ${data.name}</h2>`
  const hasnae = `<h1> Hi ${data.fa}</h1>`
  document.getElementById("app").innerHTML += test
  document.getElementById("app").innerHTML += hasnae
  document.getElementById("app").append(sayhi)
  console.log(data);
}
FetchData();
