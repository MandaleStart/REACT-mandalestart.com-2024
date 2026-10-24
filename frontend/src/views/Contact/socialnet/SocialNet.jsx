const channels = [
	{ name: 'WhatsApp', value: '+598 91 598 586', href: 'https://api.whatsapp.com/send/?phone=59891598586', icon: '💬', tone: 'cyan' },
	{ name: 'Telegram', value: '@MandaleStart', href: 'https://t.me/MandaleStart', icon: '✈️', tone: 'green' },
	{ name: 'LinkedIn', value: 'MandaleStart', href: 'https://www.linkedin.com', icon: '💼', tone: 'purple' },
	{ name: 'Instagram', value: '@mandalestart', href: 'https://instagram.com', icon: '📸', tone: 'orange' },
];

const SocialNet = () => {
	return (
		<div className="contact-links-wrap">
			<div className="contact-intro">
				<h3>También podés escribirme por acá</h3>
				<p>Elegí el canal que te quede más cómodo.</p>
			</div>

			{channels.map(({ name, value, href, icon, tone }) => (
				<a key={name} className={`contact-link-item ${tone}`} href={href} target="_blank" rel="noreferrer">
					<span className="contact-icon">{icon}</span>
					<span className="contact-link-copy">
						<strong>{name}</strong>
						<small>{value}</small>
					</span>
				</a>
			))}
		</div>
	);
};

export default SocialNet;

/*<div class="banner bg-oran">
				<i class="fab fa-whatsapp fa-4x "></i>
				<div class="slider bg-oran">
					<a class="text-reset" href="https://api.whatsapp.com/send/?phone=59891895586" target="_blank">
						<p>Hablame al Whatsapp:</p>
						<p>+598 91 895 586</p>
					</a>
				</div>
			</div>
			<div class="banner">
				<i class="fab fa-facebook-messenger fa-4x"></i>
				<div class="slider ">
					<a class="text-reset" href="http://m.me/mandalestart" target="_blank">
						Hazlo por Messager Facebook
					</a>
				</div>
			</div>
			<div class="banner">
				<i class="fab fa-telegram fa-4x green"></i>
				<div class="slider">
					<a class="text-reset" href="https://msng.link/o/?MandaleStart=tg" target="_blank">
						Envíame un mensaje en Telegram
					</a>
				</div>
			</div>
			<div class="banner">
				<i class="fab fa-discord fa-4x "></i>
				<div class="slider bg_blurple">
					<a class="text-reset" href="https://discordapp.com/users/MandaleStart#7713" target="_blank">
						Y sino... Tenes Discord
					</a>
				</div>
			</div>
		 */