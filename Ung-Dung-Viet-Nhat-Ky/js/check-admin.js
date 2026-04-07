window.checkLogin = (requireAdmin = false) => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    const user = JSON.parse(localStorage.getItem("user"));

    // nếu cần admin
    if (requireAdmin) {
        if (!admin) {
            window.location.href = "../html/login.html";
        }
    } 
    // nếu là user
    else {
        if (!user) {
            window.location.href = "../html/login.html";
        }
    }
};