sap.ui.define([], function () {
    return {

        formatUserRoles: function (sRoles) {
            if (!sRoles) {
                return "";
            }

            let rolesArray = sRoles.split(",").map(role => role.trim());
            if (rolesArray.length <= 3) {
                return ""; // No need for a link if 3 or fewer roles
            }

            return ` + ${rolesArray.length - 3} More`;
        },

        formatFirstThreeRoles: function (sRoles) {
            if (!sRoles) {
                return "";
            }

            let rolesArray = sRoles.split(",").map(role => role.trim());
            return rolesArray.slice(0, 3).join(", "); // Show only the first three roles
        },

        getStatusState: function (status) {
            console.log(status)
            if (status == "ACTIVE") {
                return "Indication14"
            } else if (status == "INACTIVE") {
                return "Indication13"
            } else {
                return "Indication12"
            }
        },

        formatLimitedRoles: function (aRoles) {
            if (!aRoles || !Array.isArray(aRoles) || aRoles.length === 0) return "";

            // Extract "CODE - DESCRIPTION" format
            let aFormattedRoles = aRoles.map(role => `${role.CODE} - ${role.DESCRIPTION}`).sort();

            // Show only the first 2 roles
            let displayedRoles = aFormattedRoles.slice(0, 2).join(", ");

            return displayedRoles;
        }


    }
});