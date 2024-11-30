import { execSync } from "child_process";
import {
  createReadStream,
  existsSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { defineCommand, run } from "archons";
import { createHash } from "crypto";
import axios from "axios";
import path from "path";

const PKGBUILD_TEMPLATE = `# Maintainer: 苏向夜 <fu050409@163.com>
# Contributor: 苏向夜 <fu050409@163.com>
pkgname=algohub
pkgver=<pkgver>
pkgrel=1
pkgdesc="ACM Algorithm Hub"
arch=('x86_64')
url="https://github.com/swpu-acm/algohub.git"
license=('agplv3')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup' 'pango' 'webkit2gtk-4.1')
options=('!strip' '!emptydirs')
install=\${pkgname}.install
source_x86_64=("<source_x86>")
sha256sums_x86_64=('<sha256sums>')
package() {
  tar -xz -f data.tar.gz -C "\${pkgdir}"
  echo "[Desktop Entry]
Categories=Network;
Comment=ACM Algorithm Hub
Exec=WEBKIT_DISABLE_COMPOSITING_MODE=1 algohub
Icon=algohub
Name=algohub
Terminal=false
Type=Application
" > "\${pkgdir}/usr/share/applications/algohub.desktop"
}
`;

function generateSHA256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

const releaseAur = defineCommand({
  meta: {
    name: "release-aur",
    styled: true,
  },
  options: {
    version: {
      type: "option",
      parser: "string",
      required: true,
    },
  },
  callback: async (ctx) => {
    const basePath = process.cwd();

    // Check if AUR_SSH_KEY environment variable is set
    const AUR_SSH_KEY = process.env.AUR_SSH_KEY;
    if (!AUR_SSH_KEY) {
      console.error("AUR_SSH_KEY environment variable is not set.");
      return;
    }

    // Remove old SSH key file if it exists
    const aurSSHKeyPath = path.resolve(basePath, `.aur_ssh_key`);
    if (existsSync(aurSSHKeyPath)) {
      unlinkSync(aurSSHKeyPath);
    }

    // Write new SSH key file
    writeFileSync(aurSSHKeyPath, AUR_SSH_KEY + "\n");
    execSync(`chmod 400 ${aurSSHKeyPath}`);

    // Add aur to known hosts
    if (existsSync(`${process.env.HOME}/.ssh/known_hosts`)) {
      const knownHosts = readFileSync(`${process.env.HOME}/.ssh/known_hosts`, {
        encoding: "utf-8",
      });
      if (!knownHosts.includes("aur.archlinux.org")) {
        execSync(`ssh-keyscan -H aur.archlinux.org >> ~/.ssh/known_hosts`);
      }
    } else {
      execSync(`ssh-keyscan -H aur.archlinux.org >> ~/.ssh/known_hosts`);
    }

    // Clone AUR repository if not exists
    if (!existsSync("aur")) {
      execSync(
        `git -c init.defaultBranch=master -c core.sshCommand="ssh -i ${aurSSHKeyPath}" clone ssh://aur@aur.archlinux.org/algohub.git aur`
      );
    }
    execSync(`git -C aur config core.sshCommand "ssh -i ${aurSSHKeyPath}"`);

    const { version } = ctx.args;

    // Download binary
    const fileName = `algohub_${version}_amd64.deb`;
    const url = `https://github.com/swpu-acm/algohub/releases/download/algohub-v${version}/${fileName}`;
    const binaryPath = path.resolve(basePath, `aur/algohub.deb`);
    try {
      console.log(`Downloading ${url}...`);
      const response = await axios.get(url, { responseType: "arraybuffer" });
      writeFileSync(binaryPath, response.data, { encoding: "binary" });
      console.log("Download complete.");
    } catch (error) {
      console.error(error);
      return;
    }

    console.log("Generating SHA256 checksums...");
    const sha256sums = await generateSHA256(binaryPath);
    console.log(`SHA256 checksums: ${sha256sums}`);

    const PKGBUILD = PKGBUILD_TEMPLATE.replaceAll("<source_x86>", url)
      .replaceAll("<pkgver>", version.replaceAll("-", "_"))
      .replaceAll("<sha256sums>", sha256sums);
    writeFileSync(path.resolve(basePath, "aur/PKGBUILD"), PKGBUILD);

    execSync("makepkg --printsrcinfo > .SRCINFO", {
      cwd: "aur",
      stdio: "inherit",
    });

    // Remove cached binary
    unlinkSync(binaryPath);

    // Setup Git repository
    execSync("git -C aur add PKGBUILD .SRCINFO algohub.install", {
      stdio: "inherit",
    });
    execSync(`git -C aur config user.name "苏向夜"`);
    execSync(`git -C aur config user.email "fu050409@163.com"`);

    // Test AUR package
    execSync("makepkg -f", {
      stdio: "inherit",
      cwd: "aur",
    });

    // Publish to AUR
    execSync(`git -C aur commit -m "release: v${version}"`);
    execSync(`git -C aur push origin master`, {
      stdio: "inherit",
    });
  },
});

run(releaseAur);
