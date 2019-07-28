#!/usr/bin/env bash

set -e

exec 3>&2

modularize_file() {
	TARGET="client/nm_rework/$(basename "$1")"
	echo "** Modularize $TARGET FROM $1" >&3
	cat > $TARGET <<-JS
		// let module = { exports: {}};
		$(cat "$1")
		// export default module.exports;
JS
}

(
	patch_file="$( pwd )/jasmine-experimental-module.patch"

	# node_modules/jasmine-core/lib/jasmine-core/jasmine.js
	if [ -d node_modules/jasmine-core ]; then
		echo "Patching jasmine-core"
		pushd node_modules/jasmine-core/ > /dev/null
		# Thanks to https://unix.stackexchange.com/a/86872/240487
		if ! patch -R -p 1 -s -f --dry-run < $patch_file; then
			patch -p 1 < $patch_file "$@" || true
		fi
		popd > /dev/null
	fi

	# node_modules/jasmine/node_modules/jasmine-core/lib/jasmine-core/jasmine.js
	if [ -d node_modules/jasmine/node_modules/jasmine-core ]; then
		echo "Patching jasmine-core in jasmine"
		pushd node_modules/jasmine/node_modules/jasmine-core/ > /dev/null
		# Thanks to https://unix.stackexchange.com/a/86872/240487
		if ! patch -R -p 1 -s -f --dry-run < $patch_file; then
			patch -p 1 < $patch_file "$@" || true
		fi
		popd > /dev/null
	fi
)

(
	echo "Patching lodash-es type"
	pushd node_modules/lodash-es > /dev/null
	if [ ! -r package.json.init ]; then
		cp package.json package.json.init
	fi
	cat package.json.init | jq ".type = \"module\"" > package.json
	popd > /dev/null
)

