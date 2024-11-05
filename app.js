const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Added path module
const db = require('./db/database'); // Import the db connection
const https = require('https');//https
const fs = require('fs');//https
const QRCode = require('qrcode');
const session = require('express-session');

const dayjs = require('dayjs'); // Import Day.js
const timezone = require('dayjs/plugin/timezone'); // Import timezone plugin
const utc = require('dayjs/plugin/utc'); // Import UTC plugin

dayjs.extend(utc); // Use UTC plugin
dayjs.extend(timezone); // Use timezone plugin

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,              // Prevents resaving session if unmodified
    saveUninitialized: true,    // Forces a session that is "uninitialized" to be saved
    cookie: { secure: false }   // If using HTTPS, set this to true
}));

const options = {
    key: fs.readFileSync(path.join(__dirname, './certs/privatekey.pem')), // Path to your private key
    cert: fs.readFileSync(path.join(__dirname, './certs/certificate.pem')) // Path to your certificate
};

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mainpage.html')); 
});

// Fetch the next scholar ID
app.get('/nextScholarId', (req, res) => {
    const scholarIdQuery = 'SELECT COALESCE(MAX(scholar_id), 9999) + 1 AS next_scholar_id FROM Scholars';
    
    db.query(scholarIdQuery, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching next scholar ID' });
        }
        const nextScholarId = result[0].next_scholar_id;
        res.json({ nextScholarId });
    });
});

// Fetch departments
app.get('/departments', (req, res) => {
    const query = 'SELECT dept_name FROM Department';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Fetch schedules
app.get('/schedules', (req, res) => {
    const query = 'SELECT schedule FROM schedules';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// Fetch churches
app.get('/churches', (req, res) => {
    const query = 'SELECT church_name FROM Church';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});
//dept_login 
app.post('/login_dprsnl', (req, res) => {
    const { email, password } = req.body;

    // Query to check if personnel email exists in the database
    const query = 'SELECT * FROM Dept_Personnel WHERE personnel_email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving personnel data');
        }

        // Check if email exists in the database
        if (results.length === 0) {
            return res.status(400).send('Personnel email not found');
        }

        const personnel = results[0];

        // Compare entered password with the stored password
        if (personnel.personnel_password === password) {
            // Set session data
            req.session.personnel = {
                dept_id: personnel.dept_id,
                email: personnel.personnel_email // Store any other needed info
            };
            res.redirect('/dept_personnel.html'); // Redirect to personnel page
        } else {
            res.status(400).send('Incorrect password');
        }
    });
})

app.get('/scholars', (req, res) => {
    // Ensure personnel information exists
    if (!req.session.personnel) {
        return res.status(401).send('Unauthorized: Please log in');
    }

    const personnelDeptId = req.session.personnel.dept_id; // Store the personnel info upon login
    const currentDay = dayjs().tz("Asia/Manila").format('dddd'); // Get current day in Philippines

    // Map days to the corresponding schedules in the database
    const scheduleMap = {
        'Monday': ['Monday 8-12pm', 'Monday 1-5pm'],
        'Tuesday': ['Tuesday 8-12pm', 'Tuesday 1-5pm'],
        'Wednesday': ['Wednesday 8-12pm', 'Wednesday 1-5pm'],
        'Thursday': ['Thursday 8-12pm', 'Thursday 1-5pm'],
        'Friday': ['Friday 8-12pm', 'Friday 1-5pm'],
        'Saturday': ['Saturday 8-12pm', 'Saturday 1-5pm'],
        'Sunday': [] // Assuming no schedule on Sunday
    };

    const schedulesToFetch = scheduleMap[currentDay];

    // Construct a query that checks for all scholars in the current department and schedules
    const query = `
        SELECT scholar_id, name 
        FROM Scholars 
        WHERE dept_id = ? AND schedule_id IN (
            SELECT id FROM schedules WHERE schedule IN (?)
        )
    `;

    // Prepare the query with a placeholder for multiple schedules
    db.query(query, [personnelDeptId, schedulesToFetch], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving scholars');
        }
        res.json(results); // Respond with the results in JSON format
    });
});
// Endpoint to check if the scholar's dept_id matches the personnel's dept_id
app.get('/check-department/:scholar_id', (req, res) => {
    if (!req.session.personnel) {
        return res.status(401).send('Unauthorized: Please log in');
    }

    const personnelDeptId = req.session.personnel.dept_id;
    const scholarId = req.params.scholar_id;

    // Query to check the scholar's department
    const query = 'SELECT dept_id FROM Scholars WHERE scholar_id = ?';
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving scholar department data');
        }
        if (results.length === 0) {
            return res.status(400).send('Scholar not found');
        }

        const scholarDeptId = results[0].dept_id;

        // Check if the departments match
        if (scholarDeptId === personnelDeptId) {
            res.json({ match: true });
        } else {
            res.json({ match: false });
        }
    });
});
// Church Personnel Login Route
app.post('/system_admin', (req, res) => {
    const { email, password } = req.body;

    // Query to check if personnel email exists in the database
    const query = 'SELECT * FROM System_Admin WHERE admin_email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving Admin data');
        }

        // Check if email exists in the database
        if (results.length === 0) {
            return res.status(400).send('Admin email not found');
        }

        const Admin = results[0];

        // Compare entered password with the stored password
        if (Admin.admin_password === password) {
            // Store personnel ID and church ID in the session
            req.session.adminEmail = Admin.admin_email; // Store personnel ID
            req.session.adminPassword = Admin.admin_password; // Store church ID

            // Redirect to the church personnel dashboard
            res.redirect('/admin_dashboard.html');
        } else {
            res.status(400).send('Incorrect password');
        }
    });
});
// Endpoint to get department admin data
app.get('/department-admins', (req, res) => {
    const query = `
        SELECT da.deptAdmin_name, d.dept_name, 
               (SELECT COUNT(*) FROM Scholars WHERE dept_id = d.dept_id) AS total_members,
               (SELECT COUNT(*) FROM Dept_Personnel WHERE dept_id = d.dept_id) AS total_personnel
        FROM Dept_Admin da
        JOIN Department d ON da.dept_id = d.dept_id
    `;
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Endpoint to get church admin data
app.get('/church-admins', (req, res) => {
    const query = `
        SELECT ca.chAdmin_name, c.church_name,
               (SELECT COUNT(*) FROM Scholars WHERE church_id = c.church_id) AS total_members,
               (SELECT COUNT(*) FROM Church_Personnel WHERE church_id = c.church_id) AS total_personnel
        FROM Church_Admin ca
        JOIN Church c ON ca.church_id = c.church_id
    `;
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});
// Endpoint to get all scholars with total time and total fellowship
app.get('/all-scholars', (req, res) => {
    const query = `
        SELECT s.scholar_id, s.name, 
               COALESCE(SUM(l.total_duty_time), 0) AS total_duty_time, 
               COALESCE(SUM(fl.total_fellowship), 0) AS total_fellowship
        FROM Scholars s
        LEFT JOIN logs l ON s.scholar_id = l.scholar_id
        LEFT JOIN fellowship_logs fl ON s.scholar_id = fl.scholar_id
        GROUP BY s.scholar_id, s.name
    `;

    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


// Church Personnel Login Route
app.post('/login_chprsnl', (req, res) => {
    const { email, password } = req.body;

    // Query to check if personnel email exists in the database
    const query = 'SELECT * FROM Church_Personnel WHERE ch_personnel_email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving personnel data');
        }

        // Check if email exists in the database
        if (results.length === 0) {
            return res.status(400).send('Personnel email not found');
        }

        const personnel = results[0];

        // Compare entered password with the stored password
        if (personnel.ch_personnel_password === password) {
            // Store personnel ID and church ID in the session
            req.session.personnelId = personnel.ch_personnel_id; // Store personnel ID
            req.session.churchId = personnel.church_id; // Store church ID

            // Redirect to the church personnel dashboard
            res.redirect('/ch_personnel.html');
        } else {
            res.status(400).send('Incorrect password');
        }
    });
});// 1 
// Get scholars associated with the same church ID as the logged-in personnel
app.get('/get_scholars', (req, res) => {
    if (!req.session.churchId) {
        return res.status(401).send('Unauthorized: No church ID found');
    }

    const churchId = req.session.churchId;

    const query = 'SELECT name, scholar_id FROM Scholars WHERE church_id = ?';
    db.query(query, [churchId], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving scholars');
        }

        res.json(results); // Send results as JSON
    });
});

// Endpoint to record fellowship
app.post('/record-fellowship', (req, res) => {
    const { scholar_id, fellowship } = req.body;

    // First, get the current total_fellowship count
    const selectQuery = 'SELECT total_fellowship FROM fellowship_logs WHERE scholar_id = ? ORDER BY fellowship DESC LIMIT 1';
    db.query(selectQuery, [scholar_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ success: false, message: 'Error fetching fellowship count' });
        }

        const currentFellowship = result.length > 0 ? result[0].total_fellowship + 1 : 1;

        // Insert the new fellowship record
        const insertQuery = 'INSERT INTO fellowship_logs (scholar_id, fellowship, total_fellowship) VALUES (?, ?, ?)';
        db.query(insertQuery, [scholar_id, fellowship, currentFellowship], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ success: false, message: 'Error recording fellowship' });
            }

            res.status(200).send({ success: true, total_fellowship: currentFellowship });
        });
    });
});

// Endpoint to get the last fellowship record for a scholar
app.get('/get_last_fellowship/:scholar_id', (req, res) => {
    const scholarId = req.params.scholar_id;

    const query = 'SELECT fellowship FROM fellowship_logs WHERE scholar_id = ? ORDER BY fellowship DESC LIMIT 1';
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ success: false, message: 'Error fetching last fellowship record' });
        }
        
        // If a record exists, return the last fellowship date, otherwise return null
        const lastFellowship = results.length > 0 ? results[0].fellowship : null;
        res.json({ last_fellowship: lastFellowship });
    });
});

// Get scholar's church ID and compare with personnel's church ID
app.get('/get_scholar_church/:scholar_id', (req, res) => {
    const scholarId = req.params.scholar_id;

    if (!req.session.churchId) {
        return res.status(401).send('Unauthorized: No church ID found');
    }

    const personnelChurchId = req.session.churchId;

    // Query to get scholar's church ID
    const query = 'SELECT church_id FROM Scholars WHERE scholar_id = ?';
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            console.error('Error fetching scholar church ID:', err);
            return res.status(500).json({ success: false, message: 'Error retrieving scholar church data' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Scholar not found' });
        }

        const scholarChurchId = results[0].church_id;

        // Compare the scholar's church ID with the logged-in personnel's church ID
        const sameChurch = scholarChurchId === personnelChurchId;

        // Return the scholar's church ID, personnel church ID, and comparison result
        res.json({
            church_id: scholarChurchId,
            personnelChurchId: personnelChurchId, // Include personnelChurchId in the response
            same_church: sameChurch
        });

        // Log in the system terminal if the churches are different
        if (!sameChurch) {
            console.log(`Warning: Scholar from a different church (Scholar Church ID: ${scholarChurchId}, Personnel Church ID: ${personnelChurchId})`);
        }
    });
});

// Church Admin Login Route
app.post('/login_chAdmin', (req, res) => {
    const { email, password } = req.body;

    // Query to check if personnel email exists in the database
    const query = 'SELECT * FROM Church_Admin WHERE chAdmin_email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving Church Admin data');
        }

        // Check if email exists in the database
        if (results.length === 0) {
            return res.status(400).send('Church Admin email not found');
        }

        const chAdmin = results[0];

        // Compare entered password with the stored password
        if (chAdmin.chAdmin_password === password) {
            // Store personnel ID and church ID in the session
            req.session.chAdminEmail = chAdmin.chAdmin_email; // Store personnel ID
            req.session.churchId = chAdmin.church_id; // Store church ID

            // Redirect to the church personnel dashboard
            res.redirect('/ch_Admin.html');
        } else {
            res.status(400).send('Incorrect password');
        }
    });
});

app.get('/church_members', (req, res) => {
    const churchId = req.session.churchId;

    const query = `
        SELECT S.scholar_id, S.name, COUNT(DISTINCT FL.total_fellowship) AS total_fellowship
        FROM Scholars S
        LEFT JOIN fellowship_logs FL ON S.scholar_id = FL.scholar_id
        WHERE S.church_id = ?
        GROUP BY S.scholar_id, S.name
    `;
    
    db.query(query, [churchId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving church members' });
        }
        res.json(results);
    });
});


app.get('/church_personnel', (req, res) => {
    const churchId = req.session.churchId;
    console.log("Fetching personnel for Church ID:", churchId); // Debug line

    const query = 'SELECT ch_personnel_name, ch_personnel_email FROM Church_Personnel WHERE church_id = ?';
    
    db.query(query, [churchId], (err, results) => {
        if (err) {
            console.error(err); // Log the error for debugging
            return res.status(500).json({ error: 'Error retrieving church personnel' });
        }
        console.log("Personnel results:", results); // Debug line
        res.json(results);
    });
});
// Church Admin Login Route
app.post('/login_dptAdmin', (req, res) => {
    const { email, password } = req.body;

    // Query to check if personnel email exists in the database
    const query = 'SELECT * FROM Dept_Admin WHERE deptAdmin_email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving Department Admin data');
        }

        // Check if email exists in the database
        if (results.length === 0) {
            return res.status(400).send('Department Admin email not found');
        }

        const dptAdmin = results[0];

        // Compare entered password with the stored password
        if (dptAdmin.deptAdmin_password === password) {
            // Store admin ID and church ID in the session
            req.session.deptAdminEmail = dptAdmin.deptAdmin_email; // Store personnel ID
            req.session.deptId = dptAdmin.dept_id; // Store church ID

            // Redirect to the church personnel dashboard
            res.redirect('/dept_Admin.html');
        } else {
            res.status(400).send('Incorrect password');
        }
    });
});
// Route to fetch department members without duplication
app.get('/deptMembers', (req, res) => {
    if (!req.session.deptId) {
        return res.status(403).send('Unauthorized access');
    }

    const deptId = req.session.deptId;
    const query = `
        SELECT S.scholar_id, S.name, SC.schedule, SUM(L.total_time) AS total_time
        FROM Scholars S
        JOIN schedules SC ON S.schedule_id = SC.id
        LEFT JOIN logs L ON S.scholar_id = L.scholar_id
        WHERE S.dept_id = ?
        GROUP BY S.scholar_id, S.name, SC.schedule;
    `;

    db.query(query, [deptId], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving department members');
        }
        res.json(results);
    });
});

// Route to fetch department personnel
app.get('/deptPersonnel', (req, res) => {
    if (!req.session.deptId) {
        return res.status(403).send('Unauthorized access');
    }

    const deptId = req.session.deptId;
    const query = 'SELECT personnel_name, personnel_email FROM Dept_Personnel WHERE dept_id = ?';

    db.query(query, [deptId], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving department personnel');
        }
        res.json(results);
    });
});


// Scholar login
app.post('/login', (req, res) => {
    const { scholarId, password } = req.body;

    // Check if the scholar ID exists in the database
    const query = 'SELECT * FROM Scholars WHERE scholar_id = ?';
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving scholar ID');
        }
        
        if (results.length === 0) {
            // Scholar ID not found
            return res.status(400).send('Scholar ID not found');
        }

        const scholar = results[0];

        // Validate the password (ensure you hash and compare passwords properly)
        if (scholar.password === password) {  // Note: You should be using bcrypt to compare hashed passwords here
            // Password is correct, set session and proceed with login
            req.session.scholarId = scholar.scholar_id; // Set scholar ID in session
            
            // Redirect to the scholar dashboard page
            res.redirect('/scholar_dashboard.html');
        } else {
            // Incorrect password
            res.status(400).send('Incorrect password');
        }
    });
});


// Scholar signup
app.post('/signup', (req, res) => {
    const { name, gender, department, schedule, church, password } = req.body;

    // Generate the scholar ID (auto-incrementing)
    const scholarIdQuery = 'SELECT COALESCE(MAX(scholar_id), 9999) + 1 AS next_scholar_id FROM Scholars';
    
    db.query(scholarIdQuery, (err, scholarIdResult) => {
        if (err) {
            return res.status(500).send('Error generating scholar ID');
        }

        const nextScholarId = scholarIdResult[0].next_scholar_id;

        // Insert new scholar data
        const insertQuery = `
            INSERT INTO Scholars (name, gender, scholar_id, dept_id, schedule_id, church_id, password)
            VALUES (?, ?, ?, 
                (SELECT dept_id FROM Department WHERE dept_name = ?),
                (SELECT id FROM schedules WHERE schedule = ?),
                (SELECT church_id FROM Church WHERE church_name = ?),
                ?)
        `;

        db.query(insertQuery, [name, gender, nextScholarId, department, schedule, church, password], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error signing up scholar');
            }

            // Generate QR code based on the scholar ID
            const qrCodeData = `scholar_id:${nextScholarId}`;
            QRCode.toDataURL(qrCodeData, (err, url) => {
                if (err) {
                    console.error('Error generating QR code:', err);
                    return res.status(500).send('Error generating QR code');
                }

                // Update the scholar record with the generated QR code
                const updateQuery = 'UPDATE Scholars SET qr_code = ? WHERE scholar_id = ?';
                db.query(updateQuery, [url, nextScholarId], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error saving QR code');
                    }

                    res.redirect('/scholar.html');
                });
            });
        });
    });
});

// Endpoint to check the scholar's schedule against the current day
app.get('/check-schedule/:scholar_id/:current_day', (req, res) => {
    const { scholar_id, current_day } = req.params;

    // Query to get the scholar's schedule
    const scheduleQuery = 
        `SELECT s.schedule 
         FROM schedules s 
         JOIN Scholars sc ON sc.schedule_id = s.id 
         WHERE sc.scholar_id = ?`;

    db.query(scheduleQuery, [scholar_id], (err, results) => {
        if (err) {
            console.error('Error fetching schedule:', err);
            return res.status(500).json({ error: 'Error fetching schedule' });
        }

        if (results.length > 0) {
            const scholarSchedule = results[0].schedule;

            // Check if the scholar's schedule matches the current day
            if (scholarSchedule.toLowerCase().includes(current_day.toLowerCase())) {
                return res.status(200).json({ isSameDay: true });
            } else {
                return res.status(200).json({ isSameDay: false, schedule: scholarSchedule });
            }
        } else {
            return res.status(404).json({ error: 'Scholar not found or no schedule assigned' });
        }
    });
});

// Start timer endpoint
app.post('/start-timer', (req, res) => {
    const { scholar_id, start_time } = req.body;

    const insertQuery = 'INSERT INTO logs (scholar_id, start_time) VALUES (?, ?)';
    db.query(insertQuery, [scholar_id, start_time], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging start time');
        }
        console.log(`Attendance started for Scholar ID: ${scholar_id} at ${start_time}`);
        res.status(200).send('Start time logged successfully');
    });
}); // remain




// Stop timer endpoint
app.post('/stop-timer', (req, res) => {
    const { scholar_id, start_time, end_time } = req.body;

    const updateQuery = `
        UPDATE logs 
        SET end_time = ?
        WHERE scholar_id = ? AND start_time = ?;
    `;

    db.query(updateQuery, [end_time, scholar_id, start_time], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging end time');
        }
        console.log(`Attendance stopped for Scholar ID: ${scholar_id} at ${end_time}`);
        
        // After updating the end_time, calculate the total_duty_time for the current session
        const totalDutyTimeQuery = `
            UPDATE logs
            SET total_duty_time = TIMEDIFF(end_time, start_time)
            WHERE scholar_id = ? AND start_time = ?;
        `;

        db.query(totalDutyTimeQuery, [scholar_id, start_time], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error calculating total duty time');
            }

            // Now sum the total duty time for all previous sessions and the current session
            const totalTimeQuery = `
                SELECT SEC_TO_TIME(SUM(TIME_TO_SEC(total_duty_time))) AS total_time_sum
                FROM logs
                WHERE scholar_id = ?;
            `;

            db.query(totalTimeQuery, [scholar_id], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error summing total duty time');
                }

                const total_time_sum = result[0].total_time_sum;

                // Update the total_time for the scholar in the logs
                const updateTotalTimeQuery = `
                    UPDATE logs
                    SET total_time = ?
                    WHERE scholar_id = ?;
                `;

                db.query(updateTotalTimeQuery, [total_time_sum, scholar_id], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error updating total time');
                    }

                    res.status(200).send('End time logged and total time updated successfully');
                });
            });
        });
    });
});


// Scholar Dashboard Route

app.get('/dashboard', (req, res) => {
    // Check if scholar ID is stored in session
    const scholarId = req.session.scholarId; // Ensure scholar ID is stored in session upon login
    if (!scholarId) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Query to get the logs for the specific scholar
    const query = `
        SELECT s.name, d.dept_name, l.start_time, l.end_time, l.total_duty_time 
        FROM logs l
        JOIN Scholars s ON l.scholar_id = s.scholar_id
        JOIN Department d ON s.dept_id = d.dept_id
        WHERE l.scholar_id = ?
    `;
    
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching scholar logs' });
        }
        res.json(results);
    });
});

// Route to get the QR code for the logged-in scholar
app.get('/get-qr-code', (req, res) => {
    const scholarId = req.session.scholarId;  // Get the logged-in scholar ID from the session

    if (!scholarId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query to get the QR code for the scholar
    const query = 'SELECT qr_code FROM Scholars WHERE scholar_id = ?';
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving QR code' });
        }

        if (results.length === 0 || !results[0].qr_code) {
            return res.status(404).json({ error: 'QR code not found' });
        }

        // Send the QR code as a response
        res.json({ qr_code: results[0].qr_code });
    });
});

app.get('/schedule', (req, res) => {
    const scholarId = req.session.scholarId; // Assuming session stores the logged-in scholar's ID
    // Updated query to fetch data from the new structure
    const query = `
        SELECT s.name, d.dept_name, sch.schedule 
        FROM Scholars s
        JOIN Department d ON s.dept_id = d.dept_id
        JOIN schedules sch ON s.schedule_id = sch.id
        WHERE s.scholar_id = ?
    `;
    
    db.query(query, [scholarId], (error, results) => {
        if (error) {
            res.json({ error: 'Unable to fetch schedule.' });
        } else if (results.length > 0) {
            const scholar = results[0];
            res.json({
                name: scholar.name,
                dept_name: scholar.dept_name,
                schedule: scholar.schedule
            });
        } else {
            res.json({ error: 'No schedule found for this scholar.' });
        }
    });
});

app.get('/fellowship-dashboard', (req, res) => {
    const scholarId = req.session.scholarId; // Ensure scholar ID is stored in session upon login
    if (!scholarId) {
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    // Query to get fellowship logs for the specific scholar
    const query = `
        SELECT s.name, c.church_name, f.fellowship, f.total_fellowship 
        FROM fellowship_logs f
        JOIN Scholars s ON f.scholar_id = s.scholar_id
        JOIN Church c ON s.church_id = c.church_id
        WHERE f.scholar_id = ?
    `;
    
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching fellowship logs' });
        }
        res.json(results);
    });
});




//delete account
app.post('/delete_account', (req, res) => {
    const { scholarId } = req.session;  // Assuming the scholar ID is stored in session
    const { confirmed } = req.body;  // Confirmation flag from the form

    if (confirmed) {
        // First, delete the associated logs
        const deleteLogsQuery = `DELETE FROM logs WHERE scholar_id = ?`;

        db.query(deleteLogsQuery, [scholarId], (err, results) => {
            if (err) {
                return res.status(500).send('Error deleting logs');
            }

            // Now, delete the scholar record
            const deleteScholarQuery = `DELETE FROM Scholars WHERE scholar_id = ?`;

            db.query(deleteScholarQuery, [scholarId], (err, results) => {
                if (err) {
                    return res.status(500).send('Error deleting account');
                }

                // Account and logs deleted, now redirect to the mainpage.html
                res.redirect('/mainpage.html');  // Redirect to the main page after deletion
            });
        });
    } else {
        // If not confirmed, redirect back to dashboard or another page
        res.redirect('/scholar_dashboard.html');
    }
});

// Scholar password change
app.post('/change_password', (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Fetch the scholar's current password from the session
    const scholarId = req.session.scholarId;
    const query = 'SELECT password FROM Scholars WHERE scholar_id = ?';
    db.query(query, [scholarId], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving current password');
        }

        const currentStoredPassword = results[0].password;

        // Check if the current password matches the one in the database
        if (currentPassword !== currentStoredPassword) {
            return res.status(400).send('Current password does not match');
        }

        // Check if the new password matches the confirmation password
        if (newPassword !== confirmNewPassword) {
            return res.status(400).send('New passwords do not match');
        }

        // Update the password in the database
        const updateQuery = 'UPDATE Scholars SET password = ? WHERE scholar_id = ?';
        db.query(updateQuery, [newPassword, scholarId], (err) => {
            if (err) {
                return res.status(500).send('Error updating password');
            }

            // Redirect back to the dashboard with a success message
            res.redirect('/scholar_dashboard.html?msg=Password changed successfully');
        });
    });
});





// Start the server
https.createServer(options, app).listen(port, () => {
    console.log(`Secure server running on https://localhost:${port}`);
});
