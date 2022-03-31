// ----------------
// White Rabbit Video Plugin
// Prerequisites:
// jQuery
// White Rabbit's index.mjs and metadata.json downloaded locally
// Plyr's css & js downloaded locally https://plyr.io/
// Fill in: ./path/to/white/rabbit/index.mjs - ./path/to/white/rabbit/metadata.json - ./path/to/plyr.css - path/to/plyr.js
// usage: $('.white-rabbit').WhiteRabbitVideoPlugin({ videoID:'xyz', thumbID:'abc', imdbID:'tt123', title:'film title' });
// in html: insert tags like <p class="white-rabbit"></p> or <div class="white-rabbit"></div> where needed
// ----------------
(function($) {
	const defaults = {
		//required: imdbID
		//optional: defaultQuality (i.e. 720 or 480...)
	};
	const server = 'https://vz-cb1fdbea-917.b-cdn.net/';
	let client, metadata;
	$.fn.AD_WRVideo = async function(options) {
		options = $.extend({}, defaults, options);
		let requestingPayment = false, $this = this, data;
		if (!client) {
			const { WhiteRabbitClient } = await import('./path/to/white/rabbit/index.mjs');
			//uncomment "host" for test environment
			client = new WhiteRabbitClient({ /*host: 'https://staging-wallet.whiterabbit.one'*/ });
		}
		const scriptLoaded = function() {
			const strvideo = `<video crossorigin disablePictureInPicture controls preload="none" controlsList="nodownload" data-poster="${server}${data.videoID}/thumbnail_${data.thumbID}.jpg"><source type="application/x-mpegURL" src="${server}${data.videoID}/playlist.m3u8"></video>`;
			$this.each(function() {
				const $video = $(strvideo).appendTo($(this));
				if (data.quality) {
					for (let i in data.quality) {
						const size = data.quality[i], strsource = `<source type="video/mp4" size="${size}" src = "${server}${data.videoID}/play_${size}p.mp4" />`;
						$(strsource).appendTo($video);
					}
				}
				if (data.captions) {
					for (let i in data.captions) {
						const caption = data.captions[i], strtrack = `<track kind="captions" label="${caption.title}" src="${server}${data.videoID}/captions/${caption.src}" srclang="${caption.code}" default>`;
						$(strtrack).appendTo($video);
					}
				}
				const player = new Plyr($video.get(0), { title: data.title, quality: { default: options.defaultQuality || data.quality[0], options: data.quality } });
				$video.on('play', async function(ev) {
					const paid = Boolean(localStorage.getItem('wr-' + options.imdbID) || false);
					if (paid) return;

					player.pause();
					// keep paused while the payment is not complete/declined
					if (requestingPayment) return;

					requestingPayment = true;
					const res = await client.requestPayment(options.imdbID);
					requestingPayment = false;

					if (res && res.status) {
						// resume playback if paid
						localStorage.setItem(`wr-${options.imdbID}`, String(res.status));
						player.play();
					}

				});
			});
		};
		const scriptLoaded0 = function () {
			data = metadata[options.imdbID];
			if (!data) return;
			if (typeof (Plyr) === 'undefined') {
				$('<link/>', {
					rel: 'stylesheet',
					type: 'text/css',
					href: './path/to/plyr.css'
				}).appendTo('head');
				$.getScript('./path/to/plyr.js', scriptLoaded);
			} else scriptLoaded();
		};
		if (!metadata) $.getJSON('./path/to/white/rabbit/metadata.json').done(function (jsondata) { metadata = jsondata; scriptLoaded0(); });
		else scriptLoaded0();
	};
})(jQuery);
