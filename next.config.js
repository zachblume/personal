module.exports = {
    async redirects() {
        return [
            {
                source: "/",
                destination: "https://zachblume.substack.com/",
                permanent: false,
            },
            {
                source: "/(.*)",
                destination: "https://zachblume.substack.com/",
                permanent: false,
            },
        ];
    },
};
