import { Cookies } from 'cookies';

export function onClientRequest(request) {

    let cookies = new Cookies(request.getHeader('Cookie'));
    var cartCookie = cookies.get('testCookie');

    if (!cartCookie) {
        request.respondWith(200, { 'Content-Type': ['application/json; charset=utf-8'] }, '[]');
    }
}

export function onClientResponse(request, response) {
    response.setHeader('X-Powered-By', 'Akamai EdgeWorkers');
    response.setHeader('test', 'test');
}