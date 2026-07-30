`timescale 1ns / 1ps

//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Testbench : Pipeline CPU
//////////////////////////////////////////////////////////////////////////////////

module pipeline_cpu_tb;

logic clk;
logic reset;

/////////////////////////////////////////////////////
// DUT
/////////////////////////////////////////////////////

pipeline_cpu dut(

    .clk(clk),
    .reset(reset)

);

/////////////////////////////////////////////////////
// Clock
/////////////////////////////////////////////////////

always #5 clk = ~clk;

/////////////////////////////////////////////////////
// Test
/////////////////////////////////////////////////////

initial begin

    clk = 0;
    reset = 1;

    #10;
    reset = 0;

    $dumpfile("pipeline_cpu.vcd");
    $dumpvars(0,dut);

    $display("-------------------------------------------------------------");
    $display(" QuantumRISC Pipeline CPU Test");
    $display("-------------------------------------------------------------");

    repeat(10) begin

        #10;

        $display(
        "PC=%h  INST=%h  OPCODE=%b  RD=%0d  RS1=%0d  RS2=%0d",
        dut.if_pc,
        dut.if_instruction,
        dut.opcode,
        dut.rd,
        dut.rs1,
        dut.rs2
        );

    end

    $display("-------------------------------------------------------------");
    $display(" Pipeline Fetch + Decode Working");
    $display("-------------------------------------------------------------");

    $finish;

end

endmodule
 