'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'usernickname', {
      type: Sequelize.STRING(50)
    });

  },
      /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'usernickname');
    
  }
};

/**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
