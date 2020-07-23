

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

            request.onload = function () {
                if (request.status == 200) {
                    resolve(request.response);
                }
                else {
                    reject(Error(request.statusText));
                }
            };

            request.onerror = function () {
                reject(Error("Network Error"));
            };

            request.send();
        });
    }
}