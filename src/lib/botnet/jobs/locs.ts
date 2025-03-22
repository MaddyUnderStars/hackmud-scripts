import type { JobHandler } from "../jobs";
import { throwFailure } from "/lib/failure";

export const locsJob: JobHandler = (context, log) => {
	// scrape every t1 corp
	// maddy.locs the player locs

	const target = T1_CORPS[Math.floor(Math.random() * T1_CORPS.length)];
	if (!target) return; // whoops

	throwFailure($fs.maddy.search_t1({ s: { call: target, name: "" } }));
};

const T1_CORPS = [
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
