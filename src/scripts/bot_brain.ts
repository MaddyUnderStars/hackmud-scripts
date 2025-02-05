// cron users:
// katsu, squizzy, oscilio

export default () => {
	try {
		$ns.maddy.botnet();
	} catch (e) {
		$fs.chats.tell({
			to: "maddy",
			msg: e instanceof Error ? e.message : JSON.stringify(e),
		});
	}
};
