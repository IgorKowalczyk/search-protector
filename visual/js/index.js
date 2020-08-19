var preload = document.createElement('div'); preload.className = "preloader"; preload.innerHTML = '</div><div class="spinner"></div>'; document.body.appendChild(preload); window.addEventListener('load', function() { preload.className +=  ' fade'; setTimeout(function(){ preload.style.display = 'none'; },500); })

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector(".link").addEventListener("click", openBackgroundWindow);
});

function openBackgroundWindow() {
  window.open("https://igorkowalczyk.github.io");
}