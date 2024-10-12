import MailBox from "./mailbox/MailBox";
import SocialNet from "./socialnet/SocialNet";
const Contact = () => {
  return (
    <main className="d-flex flex-wrap justify-content-center">
      <section className="ws_box col-lg-4 col-12">
       <MailBox/>
      </section>
      <section className="ws_box col-lg-5 col-12">
      <SocialNet/>
      </section>
    </main>
  );
};

export default Contact;
