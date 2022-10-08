function delete_slashes(string) {
    var end_index = 0
    for (var i = 0; i < string.length; i++) {
        end_index = string.indexOf('\\')
        if (end_index != -1) {
            string = string.substring(0, end_index) + string.substring(end_index + 1)
        }
        else {break}
    }
    return string
}

function create_report(data, option) {
    console.log('test2')
    var report = []
	var wb = XLSX.utils.book_new()
    // задаём ширину колонок в excel таблице
    var wscols = [
        {wch:30},
        {wch:15},
        {wch:100},
    ]
    if (option == 'oneSheet') {
        for (var i = 0; i < data.length; i++) {
            report.push({
                'Файл': data[i]['Файл'],
                'Строка': data[i]['Строка'],
                'Текст': data[i]['Текст'],
            })
        }
        var ws = XLSX.utils.json_to_sheet(report, { header: ['Файл', 'Строка', 'Текст'] })
        ws['!cols'] = wscols
        XLSX.utils.book_append_sheet(wb, ws, 'Отчёт')
    }
	else if (option == 'manySheets') {
        var start_file = data[0]['Файл']
        for (var i = 0; i < data.length; i++) {
            var new_file = data[i]['Файл']
            if (new_file == start_file) {
                report.push({
                    'Файл': data[i]['Файл'],
                    'Строка': data[i]['Строка'],
                    'Текст': data[i]['Текст'],
                })
            }
            else {
                var ws = XLSX.utils.json_to_sheet(report, { header: ['Файл', 'Строка', 'Текст'] })
                ws['!cols'] = wscols
                if (start_file.substring(start_file.lastIndexOf('/') + 1) != '.keep')
                    XLSX.utils.book_append_sheet(wb, ws, start_file.substring(start_file.lastIndexOf('/') + 1))
                start_file = new_file
                report = []
                report.push({
                    'Файл': data[i]['Файл'],
                    'Строка': data[i]['Строка'],
                    'Текст': data[i]['Текст'],
                })
            }
        }
    }
	XLSX.writeFile(wb, "report.xlsx")
}

async function get_data(option, response, url, user_text) {
    console.log('test1')
    var files = response["files"]
    var files_count = files.length
    var files_names = []
    var results = []
    // одинаковая для всех файлов часть url
    var url = url.substring(0, url.lastIndexOf('/') + 1)
    // парсим имена файлов (полные пути)
    for (var len = files_count, i = 0; i < len; i++) {
        var file_name = files[i]["name"]
        var start_index = file_name.lastIndexOf('.')
        if (start_index != -1 && file_name.substring([start_index + 1])) {
            files_names.push(file_name)
        }
    }
    // список с url адресами для получения файлов с сервера
    var request_url_list = []
    // собираем url для request запроса к конкретному файлу на сервере
    for (var i = 0; i < files_names.length; i++) {
        var request_url = url.substring(0, url.lastIndexOf('/') + 1) + 'file?file='
        var start_index = files_names[i].indexOf('/') + 1
        var end_index = 0
        for (var j = 0; j < files_names[i].length; j++) {
            end_index = files_names[i].indexOf('/', start_index)
            if (end_index != -1) {
                request_url += '%2F' + files_names[i].substring(start_index, end_index)
                start_index = end_index + 1
            }
            else {
                request_url += '%2F' + files_names[i].substring(start_index)
                break
            }
        }
        request_url_list.push(request_url)
    }
    // Преобразуем каждый URL в промис, возвращённый fetch
    let requests = request_url_list.map(url => fetch(url).then(result => result.text()));
    // Promise.all будет ожидать выполнения всех промисов (синхронизируем результаты асинхронных запросов)
    var main_list = await Promise.all(requests)
    // перебираем все файлы
    for (var u = 0; u < files_names.length; u++) {
        var text = main_list[u]
        var start_index = 0
        // массив для всех строк в рамках одного файла
        var strings = []
        start_index = text.indexOf('content":"') + 10
        var end_index = 0
        tmp_string = ""
        // получаем строки
        for (var i = 0; i < text.length; i++) {
            var end_index = text.indexOf('\\n', start_index)
            if (end_index != -1) {
                // проверка, что это реальный перенос строки, а не \n в кавычках
                if (text[end_index - 1] != '\\') {
                    tmp_string += text.substring(start_index, end_index)  + '\n'
                    strings.push(delete_slashes(tmp_string))
                    tmp_string = ""
                }
                else {
                    tmp_string += text.substring(start_index, end_index)
                }
                start_index = end_index + 2
            }
            // если дошли до конца файла
            else {
                // если был найден \n в кавычках
                tmp_string += text.substring(start_index)
                strings.push(delete_slashes(tmp_string))
                break
            }
        }
        // парсинг содержимого всех файлов
        for (var i = 0; i < strings.length; i++) {
            var result = {}
            result['Текст'] = strings[i]
            result['Строка'] = i + 1
            result['Файл'] = files_names[u].slice(1)
            results.push(result)
        }
    }
    return results
}

// async function waitLoadPage(elem, type) {
//     if (type == 'id')
//         elem.click()
//     else
//         elem.click()
// }

function wait(ms) {
    return new Promise(function(success) {
      setTimeout(function() {
        success(true);
      }, ms);
    });
}

async function findFunctionInProject(all_files, function_name) {
    for (var t = 0; t < files.length; t++) {
        if (all_files[t].name.indexOf('.js') != -1)
            console.log(all_files[t].name)
    }
}

async function findTargetFunction(all_files, function_name, url_file, url_directory, type, start_time, projectNumber) {
    for (var i = all_files.length - 1; i >= 0; i--) {
    //for (var i = 0; i < all_files.length; i++) {
        var file = all_files[i].name.substring(1)
        if (file.substring(file.length - 3) == '.js') {
            url = 'https://app.jaicp.com/api/editorbe/accounts/' + projectNumber + '/projects/' + document.location.href.split('/')[3] + '/content/' + type + '?file='
            var split_list = file.split('/')
            for (var k = 0; k < split_list.length; k++) {
                url += '%2F' + split_list[k]
            }
            var file_text_tmp = await fetch(url)
            var file_data = await file_text_tmp.json()
            var index = file_data.content.indexOf('function ' + function_name)
            if (index != -1) {
                console.log('file: ' + file)
                var route_to_file = file.split('/')
                var tmp_route = route_to_file[0]
                //var url_directory = 'Editor.DepsBrowser.Carret_dDEPENDENCY/'
                //var url_file = 'Editor.DepsBrowser_DEPENDENCY/'
                var elem
                if (type == 'dependency')
                    var tmp_url = 'https://app.jaicp.com/' + document.location.href.split('/')[3] + '/editor?file=DEPENDENCY/' + file
                else
                    var tmp_url = 'https://app.jaicp.com/' + document.location.href.split('/')[3] + '/editor?file=/' + file
                history.pushState(null, "page 2", tmp_url)
                await wait(50)
                window.history.back()
                await wait(50)
                window.history.forward()
                await wait(50)
                document.getElementsByClassName('justui__tab-name')[2].click()
                await wait(50)
                //document.getElementsByClassName('justui__tab-name')[3].click()
                var tabs = document.getElementsByClassName('justui__tab-name')
                await wait(50)
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].textContent == file.substring(file.lastIndexOf('/') + 1)) {
                        tabs[i].parentNode.click()
                    }
                }
                await wait(50)
                //console.log('route_to_file: ' + route_to_file)
                // for (var j = 1; j <= route_to_file.length; j++) {
                //     if (tmp_route.indexOf('.js') != -1) {
                //         console.log(url_file + tmp_route)
                //         var elem = document.getElementById(url_file + tmp_route)
                //         elem.click()
                //     }
                //     else {
                //         console.log(url_directory + tmp_route)
                //         var elem = document.getElementById(url_directory + tmp_route)
                //         elem.click()
                //     }
                //     tmp_route += '/' + route_to_file[j]
                //     //await wait(300)
                // }
                // вызываем виджет поиска по странице
                document.getElementsByClassName('justui_icon-button justui_button withoutPadding btn btn-none')[7].click()
                // вставляем название функции
                document.getElementsByClassName('ace_search_field')[0].value = 'function ' + function_name
                // переходим к объявлению функции
                await wait(500)
                document.getElementsByClassName('ace_searchbtn next')[0].click()
                document.getElementsByClassName('ace_searchbtn_close')[0].click()
                console.log('Время выполнения: ' + ((new Date().getTime() - start_time) / 1000) + ' сек')
                console.log('Пройдено файлов: ' + i)
                return 0
            }
        }
    }
    return 1
}

async function goToFunction(projectNumber) {
    var start_time = new Date().getTime()
    var url = 'https://app.jaicp.com/api/editorbe/accounts/' + projectNumber + '/projects/' + document.location.href.split('/')[3] + '/content/tree'
    var q = await fetch(url)
    var all_files = await q.json()

    var function_name = window.getSelection().toString()
    //console.log('test ' + JSON.stringify(all_files.files))
    var test = all_files.files
    //searchInProject(all_files.files)
    //return 0
    var search = await findTargetFunction(all_files.files, function_name, 'Editor.DepsBrowser_DEPENDENCY/', 'Editor.DepsBrowser.Carret_dDEPENDENCY/', 'file', start_time, projectNumber)
    console.log(search)
    if (search) {
        search = await findTargetFunction(all_files.dependencies, function_name, 'Editor.DepsBrowser_DEPENDENCY/', 'Editor.DepsBrowser.Carret_dDEPENDENCY/', 'dependency', start_time, projectNumber)
        if (search) {
            console.log(((new Date().getTime() - start_time) / 1000) + ' сек')
            alert('Функция не найдена!')
        }
    }
}

async function addFunction(select) {
    var list = document.getElementsByClassName('ace_line')
    for (var i = 0; i < list.length; i++) {
        var start = list[i].textContent.indexOf('``')
        if (start != -1) {
            navigator.clipboard.writeText('rerbebebr')
            console.log(list[i].children[list[i].childElementCount - 1].textContent)
            list[i].children[list[i].childElementCount - 1].remove()
            list[i].children[list[i].childElementCount - 1].remove()
            list[i].children[list[i].childElementCount - 1].remove()
        }
    }
    if (select[2] == "1") {
        navigator.clipboard.writeText("$reactions.answer(toPrettyString(''))")
    } else if (select[2] == "2") {
        navigator.clipboard.writeText("$reactions.transition('/')")
    } else if (select[2] == "3") {
        navigator.clipboard.writeText("$reactions.buttons({text: '', transition: '/'})")
    }
 }

async function getQuickMenu() {
    var top = '200px'
    var left = '900px'
    var script = document.createElement("script")
    script.setAttribute('id', 'customScript')
    script.innerText = `
        async function tabsCount() {
            var tabs_ = "    ";
            var elem = document.getElementsByClassName('ace_cursor')[0];
            var tmp = await document.getElementsByClassName('ace_layer ace_gutter-layer ace_folding-enabled')[0];
            for (var i = 0; i < tmp.childElementCount; i++) {
                if (tmp.children[i].getAttribute('class') == 'ace_gutter-cell ace_gutter-active-line ') {
                    var index = i;
                    break;
                }
            }
            var parseString = await document.getElementsByClassName('ace_layer ace_text-layer')[0].children[index];
            var count = 1;
            for (var i = 0; i < parseString.childElementCount; i++) {
                if (parseString.children[i].getAttribute('class') == 'ace_indent-guide') {
                    count++;
                }
            }
            while (count--) { tabs_ +=  "    "};
            return tabs_;
        }

        async function selectOption(option) {
            if (option == "1") {
                navigator.clipboard.writeText("$debug.answer('')");
            } else if (option == "2") {
                navigator.clipboard.writeText("toPrettyString()");
            } else if (option == "3") {
                navigator.clipboard.writeText("$reactions.answer()");
            } else if (option == "4") {
                navigator.clipboard.writeText("$reactions.transition('/')");
            } else if (option == "5") {
                navigator.clipboard.writeText("$reactions.buttons({text: '', transition: '/'})");
            } else if (option == "6") {
                navigator.clipboard.writeText("$reactions.inlineButtons({text: '', callback_data: ''})");
            } else if (option == "7") {
                var tabs = await tabsCount();
                var text = "state:\\n" + tabs + "q!:\\n" + tabs + "a:\\n" + tabs + "script:";
                navigator.clipboard.writeText(text);
            } else if (option == "8") {
                navigator.clipboard.writeText("$context.request.query");
            } else if (option == "9") {
                navigator.clipboard.writeText("log('!!!!!' + response)");
            } else if (option == "0") {
                navigator.clipboard.writeText("for (var i = 0; i < list.length; i++) {}");
            } else if (option == "11") {
                navigator.clipboard.writeText("if: stateCounter($session, $context.currentState, 'read') < 2");
            } else if (option == "12") {
                navigator.clipboard.writeText("$reactions.timeout({interval: sec, targetState: '/state'})");
            } else if (option == "13") {
                var tabs = await tabsCount();
                var tab = "    ";

                var tmp1 = "init:\\n";
                var tmp2 = "$global.newSessionTimeout = 2 * 60 * 1000  // новая сессия начинается через 2 минуты\\n\\n";
                var tmp3 = "bind(\\"preProcess\\", function($context) {\\n";
                var tmp4 = "if ($context.session.lastActiveTime) {\\n";
                var tmp5 = "//начинаем новую сессию, если с момента последнего сообщения прошло больше 10 минут\\n";
                var tmp6 = "var interval = $jsapi.currentTime() - $context.session.lastActiveTime.valueOf()\\n";
                var tmp7 = "if (interval > newSessionTimeout) {\\n";
                var tmp8 = "$jsapi.startSession()\\n";
                var tmp9 = "}\\n";
                var tmp10 = "}\\n";
                var tmp11 = "});\\n\\n";
                var tmp12 = "bind(\\"postProcess\\", function($context) {\\n";
                var tmp13 = "$context.session.lastActiveTime = $jsapi.currentTime()\\n";
                var tmp14 = "$context.response.request = $context.request\\n";
                var tmp15 = "$context.session.prelastState = $context.session.lastState\\n";
                var tmp16 = "$context.session.lastState = $context.currentState\\n";
                var tmp17 = "});";
                var text = tmp1 + tabs + tmp2 + tabs + tmp3 + tabs + tab + tmp4 + tabs + tab + tab + tmp5 + tabs + tab + tab + tmp6 + tabs + tab + tab + tmp7 + tabs + tab + tab + tab + tmp8 + tabs + tab + tab + tmp9 + tabs + tab + tmp10 + tabs + tmp11 + tabs + tmp12 + tabs + tab + tmp13 + tabs + tab + tmp14 + tabs + tab + tmp15 + tabs + tab + tmp16 + tabs + tmp17;
                navigator.clipboard.writeText(text);
            }
            var closeElem1 = document.getElementById('optionsList');
            if (closeElem1) {
                closeElem1.remove();
            }
            var activeRow = document.getElementsByClassName('ace_text-input')[0];
            activeRow.focus();
        }

        async function closeFunctionList() {
            var closeElem = document.getElementById('optionsList');
            if (closeElem) {
                closeElem.remove();
            }
        }
    `
    if (!document.getElementById("customScript")) {
        document.head.insertAdjacentElement("beforeend", script)
    }

    var div_app = document.querySelector("div.app")
    var select = document.createElement("div")
    var option1 = document.createElement("div")
    var option2 = document.createElement("div")
    var option3 = document.createElement("div")
    var option4 = document.createElement("div")
    var option5 = document.createElement("div")
    var option6 = document.createElement("div")
    var option7 = document.createElement("div")
    var option8 = document.createElement("div")
    var option9 = document.createElement("div")
    var option10 = document.createElement("div")
    var option11 = document.createElement("div")
    var option12 = document.createElement("div")
    var option13 = document.createElement("div")
    var options = [option1, option2, option3, option4, option5, option6, option7,
        option8, option9, option10, option11, option12, option13]

    select.style.position = 'absolute'
    select.style.top = top    //`${top}px`
    select.style.left = left  //`${left}px`
    select.style.border = '1px #484747 solid'
    select.style.backgroundColor = '#25282c'
    select.style.color = '#A6E22E'
    select.style.display = 'flex'
    select.style.flexWrap = 'wrap'
    select.style.width = '280px'
    select.style.height = '250px'
    select.style.overflow = 'auto'
    select.setAttribute('id', 'optionsList')

    // название всех вариантов в списке
    option1.textContent = "1 -> $debug.answer()"
    option2.textContent = "2 -> toPrettyString()"
    option3.textContent = "3 -> $reactions.answer()"
    option4.textContent = "4 -> $reactions.transition()"
    option5.textContent = "5 -> $reactions.buttons()"
    option6.textContent = "6 -> $reactions.inlineButtons()"
    option7.textContent = "7 -> state"
    option8.textContent = "8 -> query"
    option9.textContent = "9 -> log"
    option10.textContent = "0 -> for"
    option11.textContent = "if: stateCounter > 2"
    option12.textContent = "$reactions.timeout"
    option13.textContent = "init"

    // добавить if
    //    if (string.indexOf('substring') != -1) {
    //    }

    // присваиваем стили всем элементам в списке
    for (var i = 0; i < options.length; i++) {
        options[i].style.backgroundColor = '#25282c'
        options[i].style.width = '280px'
        options[i].style.color = '#c1c1c1'
        options[i].style.font = '14px/normal monospace'
        options[i].style.border = 'solid 1px #25282c'
        options[i].style.padding = '3px 0 3px 5px'
        options[i].setAttribute('id', 'option1')
        options[i].setAttribute('onmouseover', `this.style.backgroundColor='#324f41'; this.style.borderColor='#618817'`)  //#618817 #32b341
        options[i].setAttribute('onmouseout', `this.style.backgroundColor='#25282c' ; this.style.borderColor='#25282c'`)
        options[i].setAttribute('onclick', `selectOption("${i + 1}")`)
        select.appendChild(options[i])
    }
    option10.setAttribute('onclick', `selectOption("0")`)
    div_app.appendChild(select)
    // переносим фокус с курсора на другой объект, чтобы не печатались лишние символы
    document.querySelector('[data-test-id="Editor.MainToolbar.search"]').focus()
    // задаём закрытие списка при клике на пространство редактора
    document.getElementsByClassName('ace_content')[0].setAttribute('onclick', `closeFunctionList()`)
}

// получаем отступ в пикселях от курсора до левой и до верхней границ редактора кода JustAI, функция возвращает массив из двух чисел
async function getTopDistance() {
    var box = document.getElementsByClassName('ace_layer ace_gutter-layer ace_folding-enabled')[0]
    for (var i = 0; i < box.childElementCount; i++) {
        if (box.children[i].getAttribute('class').indexOf('ace_gutter-active-line') != -1) {
            return i * 16
        }
    }
}

// возвращает координаты курсора (расстояние от левого края экрана и от верхнего края)
async function getCoordinate() {
    var elem = document.getElementsByClassName('ace_cursor')[0]
    var coordinate = window.getComputedStyle(elem).getPropertyValue("transform").split(',')
    return [coordinate[4], coordinate[5]]
}

// находим кол-во табуляций от начала строки до курсора
async function tabsCountExt() {
    var tabs_ = "    ";
    var elem = document.getElementsByClassName('ace_cursor')[0];
    var tmp = await document.getElementsByClassName('ace_layer ace_gutter-layer ace_folding-enabled')[0];
    for (var i = 0; i < tmp.childElementCount; i++) {
        if (tmp.children[i].getAttribute('class') == 'ace_gutter-cell ace_gutter-active-line ') {
            var index = i;
            break;
        }
    }
    var parseString = await document.getElementsByClassName('ace_layer ace_text-layer')[0].children[index];
    var count = 1;
    for (var i = 0; i < parseString.childElementCount; i++) {
        if (parseString.children[i].getAttribute('class') == 'ace_indent-guide') {
            count++;
        }
    }
    while (count--) { tabs_ +=  "    "};
    return tabs_;
}

// функция копирует в буфер текст выбранной функции, закрывает список и фокусируется на курсоре
async function copyFunctionText(option) {
    if (option == "1") {
        navigator.clipboard.writeText("$debug.answer('')");
    } else if (option == "2") {
        navigator.clipboard.writeText("toPrettyString()");
    } else if (option == "3") {
        navigator.clipboard.writeText("$reactions.answer()");
    } else if (option == "4") {
        navigator.clipboard.writeText("$reactions.transition('/')");
    } else if (option == "5") {
        navigator.clipboard.writeText("$reactions.buttons({text: '', transition: '/'})");
    } else if (option == "6") {
        navigator.clipboard.writeText("$reactions.inlineButtons({text: '', callback_data: ''})");
    } else if (option == "7") {
        var tabs = await tabsCountExt();
        var text = "state:\n" + tabs + "q!:\n" + tabs + "a:\n" + tabs + "script:";
        navigator.clipboard.writeText(text);
    } else if (option == "8") {
        navigator.clipboard.writeText("$context.request.query");
    } else if (option == "9") {
        navigator.clipboard.writeText("log('!!!!!' + response)");
    } else if (option == "0") {
        navigator.clipboard.writeText("for (var i = 0; i < list.length; i++) {}");
    }

    document.getElementById('optionsList').remove()
    var activeRow = document.getElementsByClassName('ace_text-input')[0]
    activeRow.focus()
}

async function enter1() {
    var keyboardEvent = new KeyboardEvent('keydown', {
        code: 'Enter',
        key: 'Enter',
        charKode: 13,
        keyCode: 13,
        view: window
    });

    document.getElementsByClassName('BaseModalFilter_container_inputsContainer BaseModalFilter_container_inputWithEnter')[0].dispatchEvent(keyboardEvent);
}

async function testFunc() {
    var script = document.createElement("script")
    script.setAttribute('id', 'customScript')
    // script.innerText = `
    //     async function enter(e) {
    //         var key=e.keyCode || e.which;
    //         document.getElementsByClassName('justui_button btn btn-success btn-sm')[0].click();
    //     }
    // `
    script.innerText = `
        async function addMyFilter(option)
    `
    if (!document.getElementById("customScript")) {
        document.head.insertAdjacentElement("beforeend", script)
    }
    document.querySelector('[data-test-id="JustUI.FilterModal.AddFilterButton"]').click()
    document.querySelector('[data-test-id=".CUSTOM_FIELDS_IN_RESPONSE"]').click()

    document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')[0].value = "request.data"
    document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')[0].focus()
    //document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')[0].setAttribute('onkeypress', 'enter(event)')

    var target = document.getElementsByClassName('BaseModalFilter_container_inputsContainer BaseModalFilter_container_inputWithEnter')[0]
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            console.log(mutation)
            document.getElementsByClassName('justui_button btn btn-success btn-sm')[0].click()
            observer.disconnect()
        })
    })
    // создаем конфигурации для наблюдателя
    var config = { subtree: true, attributes: true, childList: true, characterData: true };
    // запускаем механизм наблюдения
    observer.observe(target, config);
}

async function addFilters(option) {
    let q = setInterval(async function() {
        var targetElem = document.getElementsByClassName('filtersPanel_filtersContainer')[0]
        // проверяем, что контейнер с нужными блоками подгрузился
        if (targetElem) {
            // останавливаем таймер
            clearInterval(q)
            if (!document.getElementById('customScriptForFilters')) {
                var script = document.createElement("script")
                script.setAttribute('id', 'customScriptForFilters')
                script.innerText = `
                    async function addMyFilter(option) {
                        var config = { subtree: true, attributes: true, childList: true, characterData: true };
                        var observer = new MutationObserver(function(mutations) {
                            mutations.forEach(function(mutation) {
                                document.getElementsByClassName('justui_button btn btn-success btn-sm')[0].click();
                                observer.disconnect();
                            });
                        });
                        if (option == 'phone') {
                            if (document.querySelector('[data-test-id="JustUI.FilterModal.ShowFiltersList.CUSTOM_FIELDS_IN_RESPONSE"]')) {
                                document.querySelector('[data-test-id="JustUI.FilterModal.ShowFiltersList.CUSTOM_FIELDS_IN_RESPONSE"]').click();
                            } else {
                                document.querySelector('[data-test-id="JustUI.FilterModal.AddFilterButton"]').click();
                                document.querySelector('[data-test-id=".CUSTOM_FIELDS_IN_RESPONSE"]').click();
                            }
                            document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')['0'].value = 'request.data.phone';
                            document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')['0'].focus();
                            var target = document.getElementsByClassName('BaseModalFilter_container_inputsContainer BaseModalFilter_container_inputWithEnter')[0];
                            observer.observe(target, config);
                        } else if (option == 'dc') {
                            if (document.querySelector('[data-test-id="JustUI.FilterModal.ShowFiltersList.CUSTOM_FIELDS_IN_RESPONSE"]')) {
                                document.querySelector('[data-test-id="JustUI.FilterModal.ShowFiltersList.CUSTOM_FIELDS_IN_RESPONSE"]').click();
                            } else {
                                document.querySelector('[data-test-id="JustUI.FilterModal.AddFilterButton"]').click();
                                document.querySelector('[data-test-id=".CUSTOM_FIELDS_IN_RESPONSE"]').click();
                            }
                            document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')['0'].value = 'directionCall_list';
                            document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')['0'].focus();
                            var target = document.getElementsByClassName('BaseModalFilter_container_inputsContainer BaseModalFilter_container_inputWithEnter')[0];
                            observer.observe(target, config);
                        } else if (option == 'threads id') {
                            if (document.querySelector('[data-test-id="JustUI.FilterModal.ShowFiltersList.CUSTOM_FIELDS_IN_RESPONSE"]')) {
                                document.querySelector('[data-test-id="JustUI.FilterModal.ShowFiltersList.CUSTOM_FIELDS_IN_RESPONSE"]').click();
                            } else {
                                document.querySelector('[data-test-id="JustUI.FilterModal.AddFilterButton"]').click();
                                document.querySelector('[data-test-id=".CUSTOM_FIELDS_IN_RESPONSE"]').click();
                            }
                            document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')['0'].value = 'request.data.threadId';
                            document.getElementsByClassName('justui_input-text BaseModalFilter_container_inputWithEnterPadding form-control')['0'].focus();
                            var target = document.getElementsByClassName('BaseModalFilter_container_inputsContainer BaseModalFilter_container_inputWithEnter')[0];
                            observer.observe(target, config);
                        }
                    }

                    async function toPrettyColumnName() {
                        document.getElementsByTagName('thead')[0].innerHTML = document.getElementsByTagName('thead')[0].innerHTML.replace('directionCall_list', 'dc').replace('request.data.phone', 'phone').replace('request.data.threadId', 'threads id');
                        addThreadslinks();
                    }

                    async function addThreadslinks() {
                        var filterNames = document.getElementsByTagName('thead')[0];
                        if (filterNames.innerHTML.indexOf('request.data.threadId') != -1) {
                            var target = 'request.data.threadId';
                        } else if (filterNames.innerHTML.indexOf('threads id') != -1) {
                            var target = 'threads id';
                        }
                        for (var i = 0; i < filterNames.children[0].childElementCount; i++) {
                            if (filterNames.children[0].children[i].textContent == target) {
                                var index = i;
                                break;
                            }
                        }
                        var rows = document.getElementsByTagName('tbody')[0];
                        for (var i = 0; i < rows.childElementCount; i++) {
                            var id = rows.children[i].children[index].textContent;
                            id = parseInt(id.substring(1, id.length - 1));
                            rows.children[i].children[index].innerHTML = \`<a href="тут был прописан конфиденциальный url">\${id}</a>\`;
                        }
                    }
                `
                if (!document.getElementById("customScript")) {
                    document.head.insertAdjacentElement("beforeend", script)
                }
            }

            if (option == "add buttons") {
                // добавляем кнопку для вставки фильтра по телефону
                document.getElementsByClassName('filtersPanel_filtersContainer filtersPanel_filtersContainer_type_undefined filtersPanel_filterContainer-enter-done')[0].insertAdjacentHTML('afterEnd', `<button type="button" id="myButton1" onclick="addMyFilter('phone')" class="justui_button noIconsMargin btn btn-outline-primary btn-sm"><span>Телефон</span></button>`)
                // добавляем кнопку для вставки фильтра по direction call
                document.getElementById('myButton1').insertAdjacentHTML('afterEnd', `<button type="button" onclick="addMyFilter('dc')" id="myButton2" class="justui_button noIconsMargin btn btn-outline-primary btn-sm"><span>DC</span></button>`)
                // добавляем кнопку для вставки фильтра по threads id
                document.getElementById('myButton2').insertAdjacentHTML('afterEnd', `<button type="button" onclick="addMyFilter('threads id')" id="myButton3" class="justui_button noIconsMargin btn btn-outline-primary btn-sm"><span>Threads ID</span></button>`)
                // добавляем кнопку для вставки фильтра по client id (фильтр "по имени")
                document.getElementById('myButton3').insertAdjacentHTML('afterEnd', `<button type="button" id="myButton4" class="justui_button noIconsMargin btn btn-outline-primary btn-sm"><span>Client ID</span></button>`)
                // добавляем кнопку для изменения названий столбцов и вставки ссылок на диалоги в threads
                document.getElementById('myButton4').insertAdjacentHTML('afterEnd', `<button type="button" onclick="toPrettyColumnName()" id="myButton5" class="justui_button noIconsMargin btn btn-outline-primary btn-sm"><span>!</span></button>`)
            }
        }
    }, 200)
}

chrome.runtime.onMessage.addListener(
    async function(request, sendResponse) {
        if (request.option == 'oneSheet' || request.option == 'manySheets') {
            var data = await get_data(request.option, request.response, request.url, request.user_text)
            create_report(data, request.option)
        } else if (request.option == 'viewFunction') {
            goToFunction(request.projectNumber)
        } else if (request.option == 'funcSelect1') {
            addFunction('funcSelect1')
        } else if (request.option == 'add filters' && !document.getElementById('myButton1')) {
            addFilters("add buttons")
        }
    }
);

document.addEventListener('keyup', function(event) {
    var url = document.location.href
    // проверяем что находимся в редакторе
    if (url.indexOf('editor?file') != -1) {
        var isOptionList = document.getElementById('optionsList')
        if (!isOptionList) {
            if (event.code == "F4") {
                getQuickMenu()
            }
        } else if (event.code == "Digit1") {
            copyFunctionText("1")
        } else if (event.code == "Digit2") {
            copyFunctionText("2")
        } else if (event.code == "Digit3") {
            copyFunctionText("3")
        } else if (event.code == "Digit4") {
            copyFunctionText("4")
        } else if (event.code == "Digit5") {
            copyFunctionText("5")
        } else if (event.code == "Digit6") {
            copyFunctionText("6")
        } else if (event.code == "Digit7") {
            copyFunctionText("7")
        } else if (event.code == "Digit8") {
            copyFunctionText("8")
        } else if (event.code == "Digit9") {
            copyFunctionText("9")
        } else if (event.code == "Digit0") {
            copyFunctionText("0")
        }
    }
});
