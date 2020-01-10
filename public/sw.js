const version = 6;

const staticAssets = `dogs-pwa-${version}`;

// to disable/enable console logs
const show_logs = true;
function log(message, args = []) {
    if (show_logs) {
        if (args.length > 0) {
            console.log(message, ':', ...args);
        } else {
            console.log(message)
        }
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        precache()
    )
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        cleanCache()
    )
});

const staticAssetsToCache = [
    '/',
    '/main.js',
    '/manifest.json',
    '/icons/icon_512.png',
];

// cache all the static assets
async function precache() {
    const cache = await caches.open(staticAssets);

    log('precache:Installing: adding the static assets into the cache')
    await cache.addAll(staticAssetsToCache)
    log('precache: added static assets to cache');
}

const expectedCaches = [
    staticAssets,
    'dogs-pwa-data',
    'dogs-pwa-images',
];

// remove unused cache
async function cleanCache() {
    log('cleanCache: removing unused cache')
    const cacheKeys = await caches.keys();

    const cachesToDelete = cacheKeys.map(cache => {
        if (!(/^dogs-pwa/).test(cache)) return;

        if (expectedCaches.indexOf(cache) === -1) {
            return caches.delete(cache);
        }
    });

    await Promise.all(cachesToDelete);
}

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.hostname === 'dog.ceo') {
        event.respondWith(
            handleDogData(event.request)
        )
    } if (requestUrl.hostname === 'images.dog.ceo') {
        event.respondWith(
            handleDogImages(event.request)
        )
    } else if (requestUrl.hostname === location.hostname) {
        event.respondWith(
            handleSameOriginData(event.request)
        );
    }
});

// network first
async function handleDogData(request) {
    try {
        log('handleDogData: fetching dog data')
        const response = await fetch(request);

        const cache = await caches.open('dogs-pwa-data');
        await cache.put(request, response.clone());

        // delete the images other than this response
        log('handleDogData: deleting old dog image cache')
        const dogImageCache = await caches.open('dogs-pwa-images');
        const dogImageCacheKeys = await dogImageCache.keys();

        const freshDogImageData = await response.clone().json();
        const freshDogImageUrls = freshDogImageData.message;

        await Promise.all(
            dogImageCacheKeys.filter(request => {
                if (freshDogImageUrls.indexOf(request.url) === -1) {
                    return dogImageCache.delete(request)
                }
            })
        )
        log('handleDogData: deleted old dog image cache');

        return response;
    } catch (err) {
        log('handleDogData: error while fetching dog data', err)

        log('handleDogData: trying to get dog data from the cache');
        const cacheRes = await caches.match(request);
        if (cacheRes) {
            log('handleDogData: found cache for dog data')

            return cacheRes;
        } else {
            log('handleDogData: no dog data found in cache');
            return Promise.reject('no-match')
        }
    }
}

async function handleDogImages(request) {
    try {
        log('handleDogImages: fetching dog images');
        const response = await fetch(request);

        log('handleDogImages: saving response in cache');
        const cache = await caches.open('dogs-pwa-images');
        await cache.put(request, response.clone());
        log('handleDogImages: response saved to cache');

        return response;
    } catch (error) {
        log('handleDogImages: error while fetching dog images');

        log('handleDogImages: trying to get data from cache');
        const cacheRes = await caches.match(request);

        if (cacheRes) {
            log('handleDogImages: found cache data');

            return cacheRes;
        } else {
            log('handleDogImages: not found in cache');

            return Promise.reject('no-match');
        }
    }
}

// we are gonna store the static assets at the install of sw
// cache only
async function handleSameOriginData(request) {
    const data = await caches.match(request);

    if (data) {
        log(`handleSameOriginData: data found in cache for ${request.url}`)

        return data;
    } else {
        log(`handleSameOriginData: no data found in cache for ${request.url}`)

        return Promise.reject('no-match')
    }
}

// get data in the sw
self.addEventListener('message', ({ data }) => {
    log('Data received in sw', [ data ])
});

