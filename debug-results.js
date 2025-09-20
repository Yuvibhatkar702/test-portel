const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://anirudh:admin@cluster0.l0hgw.mongodb.net/online-examination', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(err => {
  console.log('Connection failed, using mock data instead');
  
  // Mock data analysis
  console.log('\n=== ANALYZING POTENTIAL SCORING ISSUES ===\n');
  
  console.log('1. Common causes of 0% scores:');
  console.log('   - Questions without correct answers marked (isCorrect: false on all options)');
  console.log('   - Frontend sending incorrect answer indices');
  console.log('   - Backend calculation logic error');
  console.log('   - Database corruption or migration issues');
  
  console.log('\n2. Key areas to check:');
  console.log('   a) Test question structure:');
  console.log('      - Each question.options should have at least one option.isCorrect = true');
  console.log('   b) Answer submission:');
  console.log('      - Frontend should send correct array of answer indices');
  console.log('   c) Score calculation:');
  console.log('      - Backend compares userAnswer index with correctOption index');
  
  console.log('\n3. Debug steps:');
  console.log('   a) Check if test questions have correct answers marked');
  console.log('   b) Check if answer submission format is correct');
  console.log('   c) Verify score calculation logic');
  
  console.log('\n=== MOCK CALCULATION TEST ===\n');
  
  // Mock test data simulation
  const mockTest = {
    questions: [
      {
        questionText: 'What is 2+2?',
        options: [
          { text: '3', isCorrect: false },
          { text: '4', isCorrect: true },  // Correct answer at index 1
          { text: '5', isCorrect: false }
        ],
        marks: 1
      },
      {
        questionText: 'What is the capital of France?',
        options: [
          { text: 'London', isCorrect: false },
          { text: 'Berlin', isCorrect: false },
          { text: 'Paris', isCorrect: true }  // Correct answer at index 2
        ],
        marks: 1
      }
    ]
  };
  
  // Mock user answers
  const userAnswers = [1, 2]; // Both correct
  
  // Simulate calculation
  let correctAnswers = 0;
  mockTest.questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    const correctOption = question.options.findIndex(option => option.isCorrect);
    const isCorrect = userAnswer === correctOption;
    
    console.log(`Question ${index + 1}:`);
    console.log(`  User answered: ${userAnswer} (${question.options[userAnswer]?.text})`);
    console.log(`  Correct answer: ${correctOption} (${question.options[correctOption]?.text})`);
    console.log(`  Is correct: ${isCorrect}`);
    console.log('');
    
    if (isCorrect) correctAnswers++;
  });
  
  const percentage = Math.round((correctAnswers / mockTest.questions.length) * 100);
  console.log(`Final Score: ${correctAnswers}/${mockTest.questions.length} = ${percentage}%`);
  
  if (percentage === 0) {
    console.log('\n❌ ISSUE FOUND: Calculation would result in 0%');
    console.log('This suggests either:');
    console.log('- Questions dont have correct answers marked');
    console.log('- Answer indices are misaligned');
    console.log('- Calculation logic has bugs');
  } else {
    console.log('\n✅ Calculation logic appears correct');
    console.log('Issue likely in actual test data or answer submission');
  }
  
  process.exit(0);
});

// If connection succeeds, analyze real data
mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    const Result = mongoose.model('Result', new mongoose.Schema({
      percentage: Number,
      correctAnswers: Number,
      totalQuestions: Number,
      answers: [Number],
      test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' }
    }));
    
    const Test = mongoose.model('Test', new mongoose.Schema({
      title: String,
      questions: [{
        questionText: String,
        options: [{
          text: String,
          isCorrect: Boolean
        }],
        marks: Number
      }]
    }));
    
    // Get sample results
    const sampleResults = await Result.find().limit(3).lean();
    console.log(`Found ${sampleResults.length} results`);
    
    if (sampleResults.length > 0) {
      const result = sampleResults[0];
      console.log('\nSample Result:');
      console.log(`  Percentage: ${result.percentage}`);
      console.log(`  Correct Answers: ${result.correctAnswers}`);
      console.log(`  Total Questions: ${result.totalQuestions}`);
      console.log(`  User Answers: [${result.answers?.join(', ')}]`);
      
      // Get the test for this result
      if (result.test) {
        const test = await Test.findById(result.test).lean();
        if (test) {
          console.log(`\nTest: ${test.title}`);
          console.log(`Questions: ${test.questions?.length || 0}`);
          
          if (test.questions && test.questions.length > 0) {
            console.log('\nFirst question analysis:');
            const q = test.questions[0];
            console.log(`  Question: ${q.questionText}`);
            console.log('  Options:');
            q.options?.forEach((opt, i) => {
              console.log(`    ${i}: "${opt.text}" (correct: ${opt.isCorrect})`);
            });
            
            const correctIndex = q.options?.findIndex(opt => opt.isCorrect);
            console.log(`  Correct answer index: ${correctIndex}`);
            
            if (correctIndex === -1) {
              console.log('  ❌ NO CORRECT ANSWER FOUND - This will cause 0% scores!');
            }
          }
        }
      }
    } else {
      console.log('No results found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
});