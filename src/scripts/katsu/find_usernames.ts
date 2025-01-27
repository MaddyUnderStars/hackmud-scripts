import { throwWhitelist } from "/lib/auth";
import { isRecord } from "/lib/isRecord";

const read = (
	scriptor: (...rest: unknown[]) => unknown,
	args?: unknown,
): string => {
	return $fs.maddy.read({
		s: {
			name: "test",
			call: scriptor,
		},
		a: args,
	});
};

export default function (context: Context, args?: unknown) {
	const t1_corps = [
		$fs.amal_robo.public,
		$fs.aon.public,
		$fs.archaic.public,
		$fs.bluebun.public,
		$fs.bunnybat_hut.public,
		$fs.context.public,
		$fs.core.public,
		$fs.cyberdine.public,
		$fs.empty_nest.public,
		$fs.etceteraco.public,
		$fs.futuretech.public,
		$fs.goodfellow.public,
		$fs.halperyon.public,
		$fs.kill_9_1.public,
		$fs.kill_bio.public,
		$fs.legion_bible.public,
		$fs.legion_intl.public,
		$fs.light.public,
		$fs.lowell_extermination.public,
		$fs.merrymoor_pharma.public,
		$fs.nation_of_wales.public,
		$fs.nuutec.public,
		$fs.pica.public,
		$fs.protein_prevention.public,
		$fs.ros13.public,
		$fs.ros_13_update_checker.public,
		$fs.setec_gas.public,
		$fs.skimmerite.public,
		$fs.sn_w.public,
		$fs.soylentbean.public,
		$fs.subject_object.public,
		$fs.tandoori.public,
		$fs.the_holy_checksum.public,
		$fs.turing_testing.public,
		$fs.tyrell.public,
		$fs.vacuum_rescue.public,
		$fs.weathernet.public,
		$fs.welsh_measles_info.public,
		$fs.world_pop.public,
	];

	throwWhitelist(context.caller);

	if (args) {
		if (isRecord(args) && args.projects)
			return $db
				.f({ s: "corp_projects" })
				.array()
				.map((x) => x.name);

		return $db
			.f({ s: "corp_usernames" })
			.array()
			.map((x) => x.name);
	}

	for (const corp of t1_corps) {
		const home = read(corp);
		const empty = read(corp, {});

		const navArgName = empty.split(":")[0].split(" ").splice(-1)[0];

		// get the nav values from home page
		const [blogNav] = home
			.split("\n")
			.splice(-1)[0]
			.split("|")
			.map((x) => x.trim());

		const blog = read(corp, { [navArgName]: blogNav });

		const usernames = [
			...blog.matchAll(/(^(.*?) of project)|(-- (.*?) when being)/gim),
		].map((x) => x.filter((y) => !!y).splice(-1)[0]);

		const projects = [
			...blog.matchAll(
				/(review of .*? )|(developments on .*? )|(launch of the .*? )|(release date for .*? )/gi,
			),
		].map((x) =>
			x[0]
				.split(" ")
				.filter((x) => !!x)
				.splice(-1)[0]
				.replace(/(\.|,)$/, ""),
		);

		for (const project of projects) {
			const _id = `corp_projects_${project}`;
			$db.us({ _id }, { $set: { name: project, s: "corp_projects" } });
		}

		for (const name of usernames) {
			const _id = `corp_usernames_${name}`;
			$db.us({ _id }, { $set: { name, s: "corp_usernames" } });
		}
	}
}
