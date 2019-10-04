const Collection = require("../classes/collection");
const CronJob = require("cron").CronJob;
const attr = require("./attrs");
const queues = require("../systems/queues");

class Cron extends Collection {
  constructor() {
    super("cron");
    this.jobs = new Map();
  }

  /**
   * Code to be run when the object is instantiated.
   */
  async onLoad() {
    const jobs = await this.all().catch(error => {
      throw error;
    });
    jobs.forEach(job => {
      const jo = new CronJob(code, () => queues.oQueue.push({ key, command }));
      this.jobs.set(job.name, { ...job, jo });
      jo.start();
    });
  }

  /**
   * Add a new cron job to the system
   * @param {String} key - Key of the player starting the job.
   * @param {String} name - The name of the job
   * @param {String} code - the cron code for the job
   * @param {String} command  - the command to be evaluated when the job runs.
   */
  async add(key, name, code, command) {
    name = name.toLowerCase();
    if (!this.jobs.has(name)) {
      const job = new CronJob(code, () => queues.oQueue.push({ key, command }));
      job.start();
      await this.save({ name, key, code, command }).catch(error => {
        throw error;
      });
      this.jobs.add(name, { name, key, code, command, job });
    } else {
      throw new Error("Cron Job already exists.");
    }
  }

  /**
   * Edit a cron job.
   * @param {String} name - Name of the job to edit.
   * @param {Object} edits - Edits to be made in object literal notation.
   *
   * @example
   * mush.cron.edit("Job1", {
   *    code: `5 * * * *`,
   *    command: `@trig #14/CRON_JOB_TRIG = 1, 2, 3`
   * })
   */
  async edit(name, edits) {
    name = name.toLowerCase();
    // Stop the old job
    const sysJob = this.jobs.get(name);
    sysJob.job.stop();
    for (const edit in edits) {
      if (sysJob.hasOwnProperty(edit)) {
        sysJob[edit] = edits[edit];
      }
    }
    // create a new job and update the database.
    const job = new CronJob(sysJob.code, () =>
      queues.oQueue.push({ key, command })
    );
    job.start();
    this.jobs.set(name, { ...sysJob, job });
    await this.update(sysJob._key, sysJob).catch(error => {
      throw error;
    });
  }

  /**
   * Delete a job from the system.
   * @param {String} job - The name of the job to delete
   */
  async delete(job) {
    job = job.toLowerCase();
    await this.remove(this.jobs.get(job)).catch(error => {
      throw error;
    });
    this.job.get(job).job.stop();
    this.jobs.delete(job);
  }
}

module.exports = new Cron();
