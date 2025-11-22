import { Link } from "react-router-dom";
import { Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border py-12 px-6">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
                <span className="text-gold-foreground text-xl font-bold">
                  ♔
                </span>
              </div>
              <span className="text-xl font-bold">
                <span className="text-gold">Null</span>
                <span className="text-accent">Shot</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Decentralized chess with on-chain glory. Built on NullShot MCP.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/arena"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Play Arena
              </Link>
              <Link
                to="/leaderboard"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                to="/how-to-play"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                How to Play
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <div className="flex flex-col gap-2">
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                About Project
              </Link>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Smart Contract
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-card rounded-lg flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/chisom_georgee"
                className="w-10 h-10 bg-card rounded-lg flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:georgechipaul@gmail.com"
                className="w-10 h-10 bg-card rounded-lg flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © 2025 NullShot Chess. Built with ♔ for NullShot Hacks. Powered by
            Thirdweb.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
