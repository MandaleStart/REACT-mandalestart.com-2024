const channels = [
	{ name: 'WhatsApp', value: '+598 91 598 586', href: 'https://api.whatsapp.com/send/?phone=59891598586', icon: '💬', tone: 'cyan' },
	{ name: 'Telegram', value: '@MandaleStart', href: 'https://t.me/MandaleStart', icon: '✈️', tone: 'green' },
	{ name: 'LinkedIn', value: 'MandaleStart', href: 'https://www.linkedin.com/in/mandalestart', icon: '💼', tone: 'purple' },
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
