window.addEventListener("mousedown", saveLinkTarget, true);
window.addEventListener("mousedown", restoreLinkTarget, false);
window.addEventListener("click", interceptEvent, true);
window.addEventListener("keydown", interceptEvent, true);

function detach()
{
  try
  {
    window.removeEventListener("mousedown", saveLinkTarget, true);
    window.removeEventListener("mousedown", restoreLinkTarget, false);
    window.removeEventListener("click", interceptEvent, true);
    window.removeEventListener("keydown", interceptEvent, true);
  }
  catch (e)
  {

  }
}

let currentLink = null;
let currentLinkHref = null;

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

let containerAttr = {
  "google": "#search,.gsc-wrapper",
  "google-groups": "[role=main]",
  "google-images": "[data-cid^=GRID]",
};

function isSearchPage(window)
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

  }

  for (let type of ["google", "google-images"])
    if (document instanceof HTMLDocument && document.querySelector(containerAttr[type]))
      return type;

  if (document.readyState == "complete")
    detach();
  return null;
}

function isSearchResult(link)
{
  let type = isSearchPage(link.ownerDocument.defaultView);
  if (type === null)
    return false;

  if (containerAttr.hasOwnProperty(type))
  {
    let selector = containerAttr[type];
    for (let parent = link; parent; parent = parent.parentNode)
      if ("matches" in parent && parent.matches(selector))
        return true;
  }
  return false;
}

function saveLinkTarget(event)
{
  let type = isSearchPage(event.target.ownerDocument.defaultView);
  if (!type)
    return;

  for (currentLink = event.target; currentLink; currentLink = currentLink.parentNode)
    if (currentLink.localName == "a")
      break;

  currentLinkHref = (currentLink ? currentLink.href : null);

  if (type == "yandex" && currentLink)
    currentLink.removeAttribute("data-counter");
  setTimeout(restoreLinkTarget, 0);
}

function restoreLinkTarget(event)
{
  try
  {
    if (currentLink && currentLink.href != currentLinkHref)
      currentLink.href = currentLinkHref;
  }
  catch (e)
  {
	  
  }

  currentLink = currentLinkHref = null;
}

function interceptEvent(event)
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