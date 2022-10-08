chrome.runtime.onInstalled.addListener(function() {
	var exportFiles = chrome.contextMenus.create({
		type: "normal",
		id: "exportFiles",
		title: "Сохранить все файлы в excel",
		contexts: ["page", "selection"]
	});
	chrome.contextMenus.create({
		type: "normal",
		id: "oneSheet",
		title: "Сохранить на один лист",
		contexts: ["page", "selection"],
		parentId: exportFiles
	});
	chrome.contextMenus.create({
		type: "normal",
		id: "manySheets",
		title: "Сохранить на отдельные листы",
		contexts: ["page", "selection"],
		parentId: exportFiles
	});
	chrome.contextMenus.create({
		type: "normal",
		id: "viewFunction",
		title: "Перейти к функции",
		contexts: ["page", "selection"]
	});
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	// Отправить сообщение на активную вкладку
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		var option = info.menuItemId
		if (option == 'oneFile1')
			var user_text = prompt('Введите текст для поиска', 'Парсим отдельный файл')
		var current_url = tabs[0].url
		var url = current_url
		var startNumber = current_url.indexOf('-') + 1
		var projectNumber = current_url.substring(startNumber, current_url.indexOf('-', startNumber))
		var start_project_name = current_url.indexOf('app.jaicp.com') + 14
		var end_project_name = current_url.indexOf('/', start_project_name)
		var project_name = current_url.substring(start_project_name, end_project_name)
		var url = current_url.substring(0, start_project_name) + 'api/editorbe/accounts/' + projectNumber + '/projects/' + project_name + '/content/tree'
		fetch(url).then(r => r.json()).then(result => {
			chrome.tabs.sendMessage(tabs[0].id, {"option": option, "projectNumber": projectNumber, "response": result, "url": url, "user_text": user_text})
		});
	});
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if(changeInfo.url != null) {
		if ((changeInfo.url.indexOf('app.jaicp.com') != -1) && changeInfo.url.indexOf('statistic/dialogs?filter') != -1) {
			// Отправить сообщение на активную вкладку
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {"option": "add filters"})
			});
		}
    }
});
