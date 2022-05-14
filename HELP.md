## Dataton Watchout

**Available commands for Dataton Watchout**

* Run
* Pause
* Kill
* Reset
* Jump to time
* Jump to cue
* Go online
* Enter Standby
* Set Input
* Load Show
* Layer Conditions
* Get Aux Timelines Names (available if using feedbacks)
* Toggle Run (available if using feedbacks)

The Parameter when loading a Show with "Load Show" is different when controlling a production computer or a display cluster.

When loading a show on a production computer use the path to the show file and if needed with forward slashes, eg: C:/mygreatestshows/nicetry.watch

When loading a show on a display cluster only use the name of the show file (even without .watch), eg: nicetry

You have to distribute the show to the display computers before and you must only use basic ASCII characters in show and path names.

**Feedbacks and variables**

When using "Simple (feedbacks only)" Companion will ask Watchout to send status updates only for the tasks you are monitoring.

In "Advanced (feedbacks and variables)" mode, Watchout will send status updates for all the tasks in the tasklist, generating more network traffic and increasing the load on the Production.

There is no polling going on for feedbacks and variables, the production PC sends status updates automatically without further requests.

**Polling**

Polling will automatically keep updated the task list used in this instance for dropdown menus, presets, feedback and variables.
Network traffic and load on production PC will increase.

If polling is disable you need to use **"Get Aux Timelines Names"** action manually to refresh the task list.

**Feedback and task deletion warning**

If you delete a task when a feedback/variable is active, its status will appear as "stop" and Watchout will continue sending updates on that
task status, even if it has been deleted. If you later create a new task with the same name as the old one, feedbacks from the new and the old
task will mix up and status will keep changing from "stop" (the old, deleted task status) and the correct one from the new task. To fix this
error just disable and enable the instance. Unfortunately this bug comes from Watchout and is not controllable by Companion.
