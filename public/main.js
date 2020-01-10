(async (d, w) => {
    try {
        const res = await fetch('https://dog.ceo/api/breeds/image/random/6');
        const data = await res.json();

        if (data.message) {
            const html = data.message.reduce((a, c) => {
                a += `<div class='dog'><img src='${c}' /></div>`;

                return a;
            }, '');

            const content = d.getElementById('content');
            content.innerHTML = html;
        } else {
            console.log('no message found in data!',data);
        }
    } catch (err) {
        console.log('error occurred', err)
    }


})(document, window);
