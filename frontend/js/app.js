async function FetchData() {
  let rese = await fetch("/api/home-content")
    .then(res => res.json())
    .then(data => {
      document.getElementById("main").innerHTML = data.html;
    });

  let data = rese.json()
  console.log(data)
}
FetchData()