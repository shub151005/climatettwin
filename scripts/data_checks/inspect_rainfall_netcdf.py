from pathlib import Path

import xarray as xr


PROJECT_ROOT = Path(__file__).resolve().parents[2]

RAINFALL_DIR = PROJECT_ROOT / "data" / "raw" / "imd" / "rainfall"


def find_netcdf_files() -> list[Path]:
    patterns = ["*.nc", "*.NC", "*.nc4", "*.NC4"]
    files: set[Path] = set()

    for pattern in patterns:
        files.update(RAINFALL_DIR.glob(pattern))

    return sorted(files)


def inspect_dataset(file_path: Path) -> None:
    print("=" * 80)
    print(f"Inspecting file: {file_path}")
    print("=" * 80)

    dataset = xr.open_dataset(file_path)

    print("\nDATASET SUMMARY")
    print(dataset)

    print("\nDIMENSIONS")
    for dim_name, dim_size in dataset.sizes.items():
        print(f"- {dim_name}: {dim_size}")

    print("\nCOORDINATES")
    for coord_name in dataset.coords:
        coord = dataset[coord_name]
        print(f"- {coord_name}: shape={coord.shape}, dtype={coord.dtype}")

        try:
            values = coord.values
            print(f"  first={values[0]}, last={values[-1]}")
        except Exception:
            print("  unable to print first/last values")

    print("\nDATA VARIABLES")
    for variable_name in dataset.data_vars:
        variable = dataset[variable_name]
        print(f"- {variable_name}")
        print(f"  shape: {variable.shape}")
        print(f"  dtype: {variable.dtype}")
        print(f"  attrs: {variable.attrs}")

    print("\nGLOBAL ATTRIBUTES")
    for key, value in dataset.attrs.items():
        print(f"- {key}: {value}")

    dataset.close()


def main() -> None:
    files = find_netcdf_files()

    if not files:
        raise FileNotFoundError(
            f"No NetCDF files found in {RAINFALL_DIR}. "
            "Put RF25_ind2025_rfp25.nc inside data/raw/imd/rainfall."
        )

    print(f"Found {len(files)} NetCDF file(s).")

    for file_path in files:
        inspect_dataset(file_path)


if __name__ == "__main__":
    main() 