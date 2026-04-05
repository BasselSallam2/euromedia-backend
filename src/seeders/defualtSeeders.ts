
import { seedAdminRole, seedAdminUser } from "./adminSeeder";


const baseSeeders = [
    { name: "AdminRole", fn: seedAdminRole },
    { name: "AdminUser", fn: seedAdminUser },
];

const defaultSeeders = baseSeeders;

export { defaultSeeders }; 
