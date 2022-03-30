// ----------------
// White Rabbit Video Plugin
// Prerequisites:
// jQuery
// White Rabbit's index.mjs downloaded locally
// Plyr's css & js downloaded locally https://plyr.io/
// Fill in: ./path/to/white/rabbit/index.mjs - ./path/to/plyr.css - path/to/plyr.js
// usage: $('.white-rabbit').WhiteRabbitVideoPlugin({ videoID:'xyz', thumbID:'abc', imdbID:'tt123', title:'film title' });
// in html: insert tags like <p class="white-rabbit"></p> or <div class="white-rabbit"></div> where needed
// ----------------
(function ($) {
	const defaults = {
		quality: { default: 720, options: [720, 480] }
		//required: videoID, thumbID, imdbID, title
	};
	const template = '<video crossorigin disablePictureInPicture controls controlsList="nodownload" data-poster="https://vz-cb1fdbea-917.b-cdn.net/|videoID|/thumbnail_|thumbID|.jpg"><source type="video/mp4" size="480" src = "https://vz-cb1fdbea-917.b-cdn.net/|videoID|/play_480p.mp4" /><source type="video/mp4" size="720" src="https://vz-cb1fdbea-917.b-cdn.net/|videoID|/play_720p.mp4" /><source type="application/x-mpegURL" src="https://vz-cb1fdbea-917.b-cdn.net/|videoID|/playlist.m3u8"></video>';
	let client;
	$.fn.WhiteRabbitVideoPlugin = async function (options) {
		options = $.extend({}, defaults, options);
		if (!client) {
			let { WhiteRabbitClient } = await import('./path/to/white/rabbit/index.mjs');
			//uncomment "host" for test environment
			client = new WhiteRabbitClient({ /*host: 'https://staging-wallet.whiterabbit.one'*/ });
		}
		let requestingPayment = false, $this = this;
		const scriptLoaded = function () {
			const strvideo = template.replace(/\|videoID\|/g, options.videoID).replace(/\|thumbID\|/g, options.thumbID)
			$this.each(function () {
				const $video = $(strvideo).appendTo($(this)), player = new Plyr($video.get(0), { title: options.title, quality: options.quality });
        if (options.captions) {
          options.captions.forEach(function (caption) {
            $video.append(`<track kind="captions" label="${caption.title}" src="https://vz-cb1fdbea-917.b-cdn.net/${options.videoID}/captions/${caption.src}" srclang="${caption.code}" default>`);
          });
        }
				$video.on('play', async function (ev) {
					const paid = Boolean(localStorage.getItem('wr-' + options.imdbID) || false);
					if (paid) return;

					player.pause();
					// keep paused while the payment is not complete/declined
					if (requestingPayment) return;

					requestingPayment = true;
					const res = await client.requestPayment(options.imdbID);
					requestingPayment = false;
					console.log(res);

					if (res && res.status) {
						// resume playback if paid
						localStorage.setItem(`wr-${options.imdbID}`, String(res.status));
						player.play();
					}

				});
			});
		};
		if (typeof (Plyr) === 'undefined') {
			$('<link/>', {
				rel: 'stylesheet',
				type: 'text/css',
				href: './path/to/plyr.css'
			}).appendTo('head');
			$.getScript('./path/to/plyr.js', scriptLoaded);
		} else scriptLoaded();
	};
})(jQuery);
