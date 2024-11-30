import axios from "axios";

const compareVersion = (a, b) => {
  const aArr = a.split("-")[0].split(".").map(Number);
  const bArr = b.split("-")[0].split(".").map(Number);
  for (let i = 0; i < aArr.length; i++) {
    if (aArr[i] > bArr[i]) {
      return 1;
    } else if (aArr[i] < bArr[i]) {
      return -1;
    }
  }

  const preSet = ["nightly", "alpha", "beta", "rc"];
  try {
    const aPre = a.split("-")[1].split(".")[0];
    const bPre = b.split("-")[1].split(".")[0];
    if (preSet.indexOf(aPre) > preSet.indexOf(bPre)) {
      return 1;
    } else if (preSet.indexOf(aPre) < preSet.indexOf(bPre)) {
      return -1;
    } else {
      const aNum = parseInt(a.split("-")[1].split(".")[1]);
      const bNum = parseInt(b.split("-")[1].split(".")[1]);
      if (aNum > bNum) {
        return 1;
      } else if (aNum < bNum) {
        return -1;
      }
    }
  } catch {}

  return 0;
};

axios
  .get(`https://api.github.com/repos/swpu-acm/algohub/git/refs/tags/`)
  .then((response) => {
    let latestTag = "0.0.0";
    const data = response.data;
    data.forEach((item) => {
      const version = item.ref.split("-v")[1];
      if (compareVersion(version, latestTag) === 1) {
        latestTag = version;
      }
    });
    console.log(latestTag);
  })
  .catch((error) => {
    console.error(error.data);
  });
