export default function (plop) {
  // Module generator
  plop.setGenerator('module', {
    description: 'Generate a new module with CRUD operations, routes, and permissions',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Module name (e.g., products, orders):',
        validate: function (value) {
          if (/.+/.test(value)) {
            return true;
          }
          return 'Module name is required';
        }
      },
      {
        type: 'input',
        name: 'Name',
        message: 'Module name (Capitalized, e.g., Products, Orders):',
        validate: function (value) {
          if (/.+/.test(value)) {
            return true;
          }
          return 'Capitalized module name is required';
        }
      },
      {
        type: 'input',
        name: 'upperName',
        message: 'Module name (UPPERCASE, e.g., PRODUCTS, ORDERS):',
        validate: function (value) {
          if (/.+/.test(value)) {
            return true;
          }
          return 'Uppercase module name is required';
        }
      }
    ],
    actions: [
      // Create module directory
      {
        type: 'addMany',
        destination: 'src/modules/{{name}}',
        templateFiles: 'plop-templates/module/*.hbs',
        base: 'plop-templates/module'
      },
      // Add import to routes.ts
      {
        type: 'append',
        path: 'src/utils/routes.ts',
        pattern: /import.*from.*upload.*routes.*;/,
        template: 'import {{name}}Router from "@modules/{{name}}/{{name}}.route";'
      },
      // Add router.use to routes.ts
      {
        type: 'append',
        path: 'src/utils/routes.ts',
        pattern: /router\.use\("\/upload".*uploadRouter\);/,
        template: 'router.use("/{{name}}", {{name}}Router);'
      },
      // Add permissions to interfaces.ts
      {
        type: 'append',
        path: 'src/utils/interfaces.ts',
        pattern: /ACTIVITYREAD: "activity:read",/,
        template: '    {{upperName}}CREATE: "{{name}}:create",\n    {{upperName}}READ: "{{name}}:read",\n    {{upperName}}UPDATE: "{{name}}:update",\n    {{upperName}}DELETE: "{{name}}:delete",'
      }
    ]
  });
}