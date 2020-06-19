window.addEventListener("mousedown", linktarget, true);
window.addEventListener("mousedown", restorelinktarget, false);
window.addEventListener("click", interceptEvent, true);
window.addEventListener("keydown", interceptEvent, true);

function detach()
{
  try
  {
    window.removeEventListener("mousedown", linktarget, true);
    window.removeEventListener("mousedown", restorelinktarget, false);
    window.removeEventListener("click", interceptevent, true);
    window.removeEventListener("keydown", interceptevent, true);
  }
  catch (e)
  {
    return;
  }
}

let currentlink = null;
let currentlinkblock = null;

let hosts = {
  "groups.google.com": "google-groups",
  "yandex.com": "yandex",
  "yandex.com.tr": "yandex",
  "yandex.by": "yandex",
  "yandex.fr": "yandex",
  "yandex.kz": "yandex",
  "yandex.ru": "yandex",
  "yandex.ua": "yandex",
};

let containerattr = {
  "google": "#search,.gsc-wrapper",
  "google-groups": "[role=main]",
  "google-images": "[data-cid^=GRID]",
};

function search(window)
{
  try
  {
    let host = window.location.host;
    if (hosts.hasOwnProperty(host))
      return hosts[host];

    host = host.replace(/^.*?\./, "");
    if (hosts.hasOwnProperty(host))
      return hosts[host];
  }
  catch (e)
  {
   return;
  }

  for (let type of ["google", "google-images"])
    if (document instanceof HTMLDocument && document.querySelector(containerattr[type]))
      return type;

  if (document.readyState == "complete")
    detach();
  return null;
}

function searchresoult(link)
{
  let type = search(link.ownerDocument.defaultView);
  if (type === null)
    return false;

  if (containerattr.hasOwnProperty(type))
  {
    let selector = containerattr[type];
    for (let parent = link; parent; parent = parent.parentNode)
      if ("matches" in parent && parent.matches(selector))
        return true;
  }
  return false;
}

function savelinktarget(event)
{
  let type = search(event.target.ownerDocument.defaultView);
  if (!type)
    return;

  for (currentlink = event.target; currentlink; currentlink = currentlink.parentNode)
    if (currentlink.localName == "a")
      break;

  currentlinkhref = (currentlink ? currentlink.href : null);

  if (type == "yandex" && currentlink)
    currentlink.removeAttribute("data-counter");
  setTimeout(restorelinktarget, 0);
}

function restorelintarget(event)
{
  try
  {
    if (currentlink && currentlink.href != currentlinkhref)
      currentlink.href = currentlinkhref;
  }
  catch (e)
  {
    return;
  }

  currentlink = currentlinkhref = null;
}

function interceptevent(event)
{
  if (event.type == "keydown" && event.keyCode != event.DOM_VK_RETURN)
    return;

  let link = null;
  for (link = event.target; link; link = link.parentNode)
    if (link.localName == "a" || link.localName == "img")
      break;

  if (link && link.localName == "a" && isSearchResult(link) &&
      /^\s*https?:/i.test(link.getAttribute("href")))
  {
    event.stopPropagation();
  }
}