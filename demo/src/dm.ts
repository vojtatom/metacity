

module DataManager {
    interface RequestOptions {
        files?: string[],
        success: (response: any) => void,
        fail: () => void
    }

    export function files(options: RequestOptions) {
        let requests = [];

        for (let file of options.files) {
            requests.push(getPromise(file));
        }

        Promise.all(requests).then(
            options.success,
            options.fail,
        );
    }

    function getPromise(url: string) {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open('GET', url);

            let loader = document.getElementById("loader");
            let strechy = UI.div({
                class: "strechy",
                html: "waiting for data...",
            });

            let bar = UI.div({
                class: "progress",
                child: strechy,
            });

            let file_title: string[] | string = url.split("/");
            file_title = file_title[file_title.length - 1];

            request.onload = function () {
                if (request.status == 200) {
                    if (bar && bar.parentElement)
                        bar.parentElement.removeChild(bar);
                    resolve(request.response);
                }
                else {
                    reject(Error(request.statusText));
                }
            };

            request.onerror = function () {
                reject(Error("Network Error"));
            };


            loader.appendChild(bar);

            request.onprogress = function(e: ProgressEvent) {
                let p = ((e.loaded / e.total) * 100).toFixed(2);
                strechy.innerHTML = p + "% " + file_title;
                strechy.style.width = p + "%";
            }


            request.send();
        });
    }
}