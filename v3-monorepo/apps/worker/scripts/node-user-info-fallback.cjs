const os = require("node:os");

const originalUserInfo = os.userInfo;

os.userInfo = (...args) => {
  try {
    return originalUserInfo(...args);
  } catch (error) {
    if (error?.code !== "ERR_SYSTEM_ERROR") throw error;

    return {
      uid: -1,
      gid: -1,
      username: process.env.USERNAME || "marklabs",
      homedir: process.env.USERPROFILE || process.cwd(),
      shell: null,
    };
  }
};
