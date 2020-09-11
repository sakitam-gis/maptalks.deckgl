const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const rollup = require('rollup')
const chalk = require('chalk')
const zlib = require('zlib')
const rimraf = require('rimraf')
const typescript = require('rollup-plugin-typescript2')
const { terser } = require('rollup-plugin-terser')
const execa = require('execa')
const ora = require('ora')
const spinner = ora({
  prefixText: `${chalk.green('\n[building tasks]')}`
})

function getPackagesName () {
  const all = fs.readdirSync(resolve('packages'))
  // drop hidden file whose name is startWidth '.'
  // drop packages which would not be published(eg: examples and docs)
  const ret = all
    .filter(name => {
      const isHiddenFile = /^\./g.test(name)
      return !isHiddenFile
    }).filter(name => {
      const isPrivatePackages = require(resolve(`packages/${name}/package.json`)).private
      return !isPrivatePackages
    })

  return ret
}

function cleanPackagesOldDist (packagesName) {
  packagesName.forEach(name => {
    const distPath = resolve(`packages/${name}/dist`)
    const typePath = resolve(`packages/${name}/dist/types`)

    if (fs.existsSync(distPath)) {
      rimraf.sync(distPath)
    }

    fs.mkdirSync(distPath)
    fs.mkdirSync(typePath)
  })
}

function resolve (p) {
  return path.resolve(__dirname, '../', p)
}

function PascalCase (pkg, str) {
  if (pkg.namespace) return pkg.namespace;
  const re = /-(\w)/g;
  const newStr = str.replace(re, function (match, group1) {
    return group1.toUpperCase();
  })
  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

const generateBanner = (json) => {
  const time = new Date();
  const year = time.getFullYear();
  const banner = `/*!\n * author: ${json.author}
 * ${json.name} v${json.version}
 * build-time: ${year}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}
 * LICENSE: ${json.license}
 * (c) 2017-${year} ${json.homepage}\n */`;
  return banner
}

const generatePackageName = (name) => {
  if (typeof name === 'string') {
    const arr_ = name.split('/');
    const fileName = arr_[arr_.length - 1];
    const ext = fileName.split('.');
    if (ext.length > 1) {
      ext.length = ext.length - 1;
    }
    return ext.join('.');
  }
  return name;
}

const buildType = [
  {
    format: 'umd',
    ext: '.js'
  },
  {
    format: 'umd',
    ext: '.min.js'
  },
  {
    format: 'cjs',
    ext: '.cjs.js'
  },
  {
    format: 'es',
    ext: '.esm.js'
  }
]

function generateBuildConfigs (packagesName) {
  const result = []
  packagesName.forEach(name => {
    const json = fs.readJsonSync(resolve(`packages/${name}/package.json`));
    const fileName = generatePackageName(json.main);
    buildType.forEach((type) => {
      const config = {
        input: resolve(`packages/${name}/src/index.ts`),
        output: {
          file: resolve(`packages/${name}/dist/${fileName}${type.ext}`),
          name: PascalCase(json, name),
          format: type.format,
          banner: generateBanner(json),
          globals: {
            maptalks: 'maptalks',
            '@deck.gl/core': 'deck'
          }
        },
        external: [
          'maptalks',
          '@deck.gl/core'
        ],
        plugins: generateBuildPluginsConfigs(name, type.ext.indexOf('min') > -1, name)
      }

      if (name === 'layers' && config.output.format !== 'es' && config.output.format !== 'cjs') {
        config.output.name = 'DeckGLLayer'
        /** Disable warning for default imports */
        config.output.exports = 'named'
        // it seems the umd bundle can not satisfies our demand
        config.output.footer = 'if(typeof window !== "undefined" && window.DeckGLLayer) { \n' +
          '  window.DeckGLLayer = window.DeckGLLayer.default;\n}'
      }
      // rollup will valiate config properties of config own and output a warning.
      // put packageName in prototype to ignore warning.
      Object.defineProperties(config, {
        packageName: {
          value: fileName
        },
        ext: {
          value: type.ext
        }
      })
      result.push(config)
    })
  })
  return result
}
function generateBuildPluginsConfigs (name, isMin) {
  const tsConfig = {
    verbosity: -1,
    tsconfig: path.join(__dirname, '../packages/', name, '/tsconfig.json')
  }
  const plugins = []
  if (isMin) {
    plugins.push(terser())
  }
  plugins.push(typescript(tsConfig))
  return plugins
}

function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built], built + 1, () => {
      builds[built - 1] = null
      built++
      if (built < total) {
        next()
      }
    })
  }
  next()
}

function buildEntry (config, curIndex, next) {
  const isProd = /min\.js$/.test(config.output.file)

  spinner.start(`${config.packageName}${config.ext} is buiding now. \n`)

  rollup.rollup(config).then((bundle) => {
    bundle.write(config.output).then(({ output }) => {
      const code = output[0].code

      spinner.succeed(`${config.packageName}${config.ext} building has ended.`)

      function report (extra) {
        console.log(chalk.magenta(path.relative(process.cwd(), config.output.file)) + ' ' + getSize(code) + (extra || ''))
        next()
      }
      if (isProd) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return err;
          const words = `(gzipped: ${chalk.magenta(getSize(zipped))})`
          report(words)
        })
      } else {
        report()
      }

      // since we need bundle code for three types
      // just generate .d.ts only once
      if (curIndex % 3 === 0) {
        generateDTSFiles(config.packageName)
      }
    })
  }).catch((e) => {
    spinner.fail('构建失败！')
    console.log(e)
  })
}

function generateDTSFiles () {
  console.log(chalk.cyan('> start generate .d.ts file to dist dir of packages own.'))
  execa.commandSync('yarn run tsc', { shell: true })
  console.log(chalk.cyan('> generate job is done.'))
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

const getAnswersFromInquirer = async (packagesName) => {
  const question = {
    type: 'checkbox',
    name: 'packages',
    scroll: false,
    message: 'Select build repo(Support Multiple selection)',
    choices: packagesName.map(name => ({
      value: name,
      name
    }))
  }
  let { packages } = await inquirer.prompt(question)
  // make no choice
  if (!packages.length) {
    console.log(chalk.yellow(`
      It seems that you did't make a choice.

      Please try it again.
    `))
    return
  }

  // chose 'all' option
  if (packages.some(pkg => pkg === 'all')) {
    packages = getPackagesName()
  }
  const { yes } = await inquirer.prompt([{
    name: 'yes',
    message: `Confirm build ${packages.join(' and ')} packages?`,
    type: 'list',
    choices: ['Y', 'N']
  }])

  if (yes === 'N') {
    console.log(chalk.yellow('[release] cancelled.'))
    return
  }

  return packages
}
const buildBootstrap = async () => {
  const packagesName = getPackagesName()
  // provide 'all' option
  packagesName.unshift('all')

  const answers = await getAnswersFromInquirer(packagesName)

  if (!answers) return

  cleanPackagesOldDist(answers)

  const buildConfigs = generateBuildConfigs(answers)

  build(buildConfigs)
}

if (process.env.INQUIRER !== 'false') {
  buildBootstrap().catch(err => {
    console.error(err)
    process.exit(1)
  });
} else {
  const modulePath = process.env.modulePath;
  if (!modulePath) return

  cleanPackagesOldDist([modulePath])

  const buildConfigs = generateBuildConfigs([modulePath])

  build(buildConfigs)
}
